import {
  AfterViewInit,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  OnDestroy,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import * as L from 'leaflet';
import { MapPoint } from '../../models/map-point';
import { MapPointService } from '../../services/map-point.service';
import { Route, Waypoint } from '../../models/route';
import { RouteService } from '../../services/route.service';

// ── Types ──────────────────────────────────────────────────────────────────────

type OsrmResponse = {
  code: string;
  routes: Array<{
    distance: number;
    duration: number;
    geometry: { coordinates: [number, number][] };
  }>;
};

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

// ── Palettes & helpers (module-level so class fields can reference them) ───────

const POI_COLORS = [
  '#e53935', '#e91e63', '#8e24aa', '#3949ab',
  '#1e88e5', '#00897b', '#43a047', '#f9a825',
  '#fb8c00', '#6d4c41', '#546e7a', '#d81b60',
];

const ROUTE_COLORS = [
  '#1565c0', '#b71c1c', '#2e7d32', '#6a1b9a',
  '#e65100', '#00695c', '#880e4f', '#33691e',
];

function randomPoiColor(): string {
  return POI_COLORS[Math.floor(Math.random() * POI_COLORS.length)];
}

// ── Component ──────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-map-view',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './map-view.html',
  styleUrl: './map-view.scss',
})
export class MapView implements AfterViewInit, OnDestroy {
  private readonly mapPointService = inject(MapPointService);
  private readonly routeService    = inject(RouteService);
  private readonly destroyRef      = inject(DestroyRef);
  private readonly snackBar        = inject(MatSnackBar);

  // ── Signals ────────────────────────────────────────────────────────────────
  mapPoints     = signal<MapPoint[]>([]);
  routes        = signal<Route[]>([]);
  activeRouteId = signal<string>('');
  routeLoading  = signal(false);
  addMode       = signal(false);
  pendingLatLng = signal<{ lat: number; lng: number } | null>(null);
  pendingLabel  = signal('');
  pendingColor  = signal(randomPoiColor());

  editingPoint   = signal<MapPoint | null>(null);
  editLabel      = signal('');
  editLatLng     = signal<{ lat: number; lng: number } | null>(null);
  editColor      = signal('');
  editReposition = signal(false);

  searchQuery   = signal('');
  searchResults = signal<NominatimResult[]>([]);
  searchLoading = signal(false);
  sidebarOpen   = signal(window.innerWidth >= 768);
  kmlImporting  = signal(false);
  currentLocale = $localize.locale ?? 'uk';

  // ── Computed ───────────────────────────────────────────────────────────────
  activeRoute       = computed(() => this.routes().find(r => r.id === this.activeRouteId()) ?? this.routes()[0] ?? { id: '', name: '', color: '', waypoints: [], options: { avoidTolls: false }, info: null });
  waypoints         = computed(() => this.activeRoute().waypoints);
  canSavePoi        = computed(() => !!this.pendingLabel().trim() && this.pendingLatLng() !== null);
  canCalculateRoute = computed(() => this.activeRoute().waypoints.length >= 2 && !this.routeLoading());
  hasWaypoints      = computed(() => this.activeRoute().waypoints.length > 0);
  hasPoints         = computed(() => this.mapPoints().length > 0);
  noMapPoints       = computed(() => this.mapPoints().length === 0 && !this.addMode());
  canSaveEdit       = computed(() => !!this.editLabel().trim() && this.editLatLng() !== null);
  canDeleteRoute    = computed(() => this.routes().length > 1);
  routeDistance     = computed(() => {
    const info = this.activeRoute().info;
    return info ? (info.distance / 1000).toFixed(1) + ' km' : null;
  });
  routeDuration = computed(() => {
    const info = this.activeRoute().info;
    if (!info) return null;
    const h = Math.floor(info.duration / 3600);
    const m = Math.floor((info.duration % 3600) / 60);
    return h > 0
      ? $localize`:@@map.durationHoursMinutes:${h}:hours: год ${m}:minutes: хв`
      : $localize`:@@map.durationMinutes:${m}:minutes: хв`;
  });

  // ── Private Leaflet / fetch state ──────────────────────────────────────────
  private readonly mapInitialized = signal(false);
  private map!: L.Map;
  private mapPointMarkers = new Map<string, L.Marker>();
  private pendingMarker:   L.Marker | null = null;
  private editMarker:      L.Marker | null = null;
  private routeLayers      = new Map<string, L.Polyline>();
  private routeTooltips    = new Map<string, L.Layer>();
  private renderedWaypointHashes = new Map<string, string>();
  private waypointMarkers: L.Marker[] = [];
  private searchMarker:    L.Marker | null = null;
  private autoCentered = false;

  constructor() {
    // Read every dependency before any early return so Angular tracks them.

    effect(() => {
      const initialized = this.mapInitialized();
      const crosshair   = this.addMode() || this.editReposition();
      if (!initialized) return;
      this.map.getContainer().style.cursor = crosshair ? 'crosshair' : '';
    });

    effect(() => {
      const initialized = this.mapInitialized();
      const latlng      = this.pendingLatLng();
      const color       = this.pendingColor();
      if (!initialized) return;
      this.pendingMarker?.remove();
      this.pendingMarker = latlng
        ? L.marker([latlng.lat, latlng.lng], { icon: pendingIcon(color) }).addTo(this.map)
        : null;
    });

    // Re-renders waypoint markers whenever active route or its waypoints change.
    effect(() => {
      const initialized  = this.mapInitialized();
      const wps          = this.waypoints();
      const routeColor   = this.activeRoute().color;
      if (!initialized) return;
      this.waypointMarkers.forEach((m) => m.remove());
      this.waypointMarkers = wps.map((wp, i) =>
        L.marker([wp.lat, wp.lng], { icon: waypointIcon(i, routeColor) }).addTo(this.map)
      );
    });
  }

  ngAfterViewInit() {
    this.initMap();
    this.mapInitialized.set(true);
    this.loadData();
  }

  private initMap() {
    this.map = L.map('leaflet-map', { center: [48.3794, 31.1656], zoom: 6 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.map);
    this.map.on('click', (e) => this.onMapClick(e));
  }

  private loadData() {
    this.mapPointService
      .list$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((points) => {
        this.mapPoints.set(points);
        this.syncMapPointMarkers(points);
        if (!this.autoCentered) {
          this.autoCentered = true;
          if (points.length > 0) this.fitAllPoints(points);
        }
      });

    this.routeService
      .list$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((routes) => {
        this.routes.set(routes);
        if (!this.activeRouteId() && routes.length > 0) {
          this.activeRouteId.set(routes[0].id);
        }
        this.syncRouteLayers(routes);
      });
  }

  private async drawRoute(route: Route): Promise<OsrmResponse | null> {
    if (route.waypoints.length < 2) return null;

    const coords  = route.waypoints.map((w) => `${w.lng},${w.lat}`).join(';');
    const exclude = route.options.avoidTolls ? '&exclude=toll' : '';
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson${exclude}`;

    try {
      const data = (await (await fetch(url)).json()) as OsrmResponse;
      if (data.code !== 'Ok' || !data.routes.length) return null;

      const osrm    = data.routes[0];
      const latlngs = osrm.geometry.coordinates.map(([lng, lat]) => [lat, lng] as L.LatLngTuple);

      // Clear existing layer/tooltip for this route before redrawing
      this.routeLayers.get(route.id)?.remove();
      this.routeTooltips.get(route.id)?.remove();

      const layer = L.polyline(latlngs, { color: route.color, weight: 5, opacity: 0.85 }).addTo(this.map);
      this.routeLayers.set(route.id, layer);

      const dist = (osrm.distance / 1000).toFixed(1) + ' km';
      const h = Math.floor(osrm.duration / 3600);
      const m = Math.floor((osrm.duration % 3600) / 60);
      const dur = h > 0
        ? $localize`:@@map.durationHoursMinutes:${h}:hours: год ${m}:minutes: хв`
        : $localize`:@@map.durationMinutes:${m}:minutes: хв`;

      const midIdx = Math.floor(latlngs.length / 2);
      const tooltip = L.tooltip({
        permanent: true,
        direction: 'top',
        className: 'lmap-route-tooltip',
      })
        .setLatLng(latlngs[midIdx])
        .setContent(`<div class="lmap-tooltip-row" style="color:${sanitizeColor(route.color)}"><strong>${dist}</strong></div><div class="lmap-tooltip-row">${dur}</div>`)
        .addTo(this.map);

      this.routeTooltips.set(route.id, tooltip);

      // Store hash to prevent redundant auto-renders
      const hash = JSON.stringify(route.waypoints) + route.options.avoidTolls;
      this.renderedWaypointHashes.set(route.id, hash);

      return data;
    } catch (e) {
      console.error('Failed to fetch/draw route:', e);
      return null;
    }
  }

  private async syncRouteLayers(routes: Route[]) {
    // 1. Remove layers for deleted routes
    for (const [id] of this.routeLayers) {
      if (!routes.find((r) => r.id === id)) {
        this.clearRouteLayer(id);
      }
    }

    // 2. Automatically draw routes that have changed or are new
    for (const route of routes) {
      if (route.waypoints.length < 2) {
        if (this.routeLayers.has(route.id)) this.clearRouteLayer(route.id);
        continue;
      }

      const hash = JSON.stringify(route.waypoints) + route.options.avoidTolls;
      if (this.renderedWaypointHashes.get(route.id) !== hash) {
        // Redraw this route sequentially
        await this.drawRoute(route);
      }
    }
  }

  private syncMapPointMarkers(points: MapPoint[]) {
    for (const [id, marker] of this.mapPointMarkers) {
      if (!points.find((p) => p.id === id)) {
        marker.remove();
        this.mapPointMarkers.delete(id);
      }
    }
    for (const point of points) {
      const color = point.color ?? '#f57c00';
      if (this.mapPointMarkers.has(point.id)) {
        const marker = this.mapPointMarkers.get(point.id)!;
        marker.setLatLng([point.lat, point.lng]);
        marker.setIcon(poiIcon(color));
        marker.setPopupContent(poiPopupHtml(point));
        continue;
      }
      const marker = L.marker([point.lat, point.lng], { icon: poiIcon(color) })
        .addTo(this.map)
        .bindPopup(poiPopupHtml(point));
      marker.on('popupopen', () => {
        document.getElementById(`rte-poi-${point.id}`)?.addEventListener('click', () => {
          this.addWaypoint({ lat: point.lat, lng: point.lng, label: point.label });
          marker.closePopup();
        });
        document.getElementById(`del-poi-${point.id}`)?.addEventListener('click', () => {
          this.deleteMapPoint(point);
          marker.closePopup();
        });
      });
      this.mapPointMarkers.set(point.id, marker);
    }
  }

  // ── Center ─────────────────────────────────────────────────────────────────

  fitAllPoints(points?: MapPoint[]) {
    const pts = points ?? this.mapPoints();
    if (!pts.length) return;
    if (pts.length === 1) { this.map.setView([pts[0].lat, pts[0].lng], 13); return; }
    const bounds = L.latLngBounds(pts.map((p) => [p.lat, p.lng] as L.LatLngTuple));
    this.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }

  // ── Search ─────────────────────────────────────────────────────────────────

  async searchAddress() {
    const q = this.searchQuery().trim();
    if (!q) return;
    this.searchLoading.set(true);
    this.searchResults.set([]);
    try {
      const url  = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`;
      const data = (await (await fetch(url, { headers: { 'Accept-Language': this.currentLocale } })).json()) as NominatimResult[];
      this.searchResults.set(data);
      if (!data.length) this.snackBar.open($localize`:@@map.noSearchResults:Нічого не знайдено`, $localize`:@@common.ok:OK`, { duration: 2500 });
    } catch {
      this.snackBar.open($localize`:@@map.searchFailed:Пошук не вдався`, $localize`:@@common.ok:OK`, { duration: 3000 });
    } finally {
      this.searchLoading.set(false);
    }
  }

  selectSearchResult(result: NominatimResult) {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    this.searchMarker?.remove();
    this.searchMarker = L.marker([lat, lng], { icon: searchIcon() })
      .addTo(this.map)
      .bindPopup(`<div class="lmap-popup"><strong>${escapeHtml(result.display_name)}</strong></div>`)
      .openPopup();
    this.map.setView([lat, lng], 14);
    this.searchResults.set([]);
    this.searchQuery.set('');
  }

  clearSearch() {
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.searchMarker?.remove();
    this.searchMarker = null;
  }

  // ── Sidebar ────────────────────────────────────────────────────────────────

  toggleSidebar() {
    this.sidebarOpen.update((v) => !v);
  }

  // ── Add POI ────────────────────────────────────────────────────────────────

  toggleAddMode() {
    this.addMode.update((v) => !v);
    if (this.addMode()) {
      this.pendingColor.set(randomPoiColor());
    } else {
      this.cancelPending();
    }
  }

  private onMapClick(e: L.LeafletMouseEvent) {
    if (this.editReposition()) {
      const latlng = { lat: e.latlng.lat, lng: e.latlng.lng };
      this.editLatLng.set(latlng);
      this.editMarker?.setLatLng([latlng.lat, latlng.lng]);
      this.editReposition.set(false);
      return;
    }
    if (!this.addMode()) return;
    this.pendingLatLng.set({ lat: e.latlng.lat, lng: e.latlng.lng });
    this.pendingLabel.set('');
  }

  cancelPending() {
    this.pendingLatLng.set(null);
    this.pendingLabel.set('');
  }

  async savePoi() {
    const latlng = this.pendingLatLng();
    const label  = this.pendingLabel().trim();
    if (!latlng || !label) return;
    await this.mapPointService.add({ label, lat: latlng.lat, lng: latlng.lng, color: this.pendingColor() });
    this.cancelPending();
    this.addMode.set(false);
  }

  randomizePendingColor() { this.pendingColor.set(randomPoiColor()); }

  // ── Edit POI ───────────────────────────────────────────────────────────────

  startEdit(point: MapPoint) {
    this.cancelEdit();
    this.editingPoint.set(point);
    this.editLabel.set(point.label);
    this.editLatLng.set({ lat: point.lat, lng: point.lng });
    this.editColor.set(point.color ?? randomPoiColor());
    this.editMarker = L.marker([point.lat, point.lng], { icon: editIcon(), draggable: true }).addTo(this.map);
    this.editMarker.on('dragend', (e) => {
      const { lat, lng } = (e.target as L.Marker).getLatLng();
      this.editLatLng.set({ lat, lng });
    });
    this.map.panTo([point.lat, point.lng]);
  }

  toggleEditReposition() { this.editReposition.update((v) => !v); }

  cancelEdit() {
    this.editMarker?.remove();
    this.editMarker = null;
    this.editingPoint.set(null);
    this.editLabel.set('');
    this.editLatLng.set(null);
    this.editColor.set('');
    this.editReposition.set(false);
  }

  async saveEdit() {
    const point  = this.editingPoint();
    const latlng = this.editLatLng();
    const label  = this.editLabel().trim();
    if (!point || !latlng || !label) return;
    await this.mapPointService.update(point.id, { label, lat: latlng.lat, lng: latlng.lng, color: this.editColor() });
    this.cancelEdit();
  }

  randomizeEditColor() { this.editColor.set(randomPoiColor()); }

  // ── Delete POI ─────────────────────────────────────────────────────────────

  async deleteMapPoint(point: MapPoint) {
    if (this.editingPoint()?.id === point.id) this.cancelEdit();
    this.mapPointMarkers.get(point.id)?.remove();
    this.mapPointMarkers.delete(point.id);
    await this.mapPointService.remove(point.id);
  }

  // ── Route management ───────────────────────────────────────────────────────

  setActiveRoute(id: string) {
    this.activeRouteId.set(id);
  }

  async addRoute() {
    const index = this.routes().length;
    const name  = $localize`:@@map.defaultRouteName:Маршрут ${index + 1}:routeNumber:`;
    const color = ROUTE_COLORS[index % ROUTE_COLORS.length];
    const id = await this.routeService.add({
      name,
      color,
      waypoints: [],
      options: { avoidTolls: false },
      info: null
    });
    this.activeRouteId.set(id);
  }

  async removeRoute(id: string) {
    if (this.routes().length <= 1) return;
    this.clearRouteLayer(id);
    if (this.activeRouteId() === id) {
      const remaining = this.routes().filter(r => r.id !== id);
      this.activeRouteId.set(remaining[0].id);
    }
    await this.routeService.remove(id);
  }

  // ── Waypoints (scoped to active route) ────────────────────────────────────

  async addWaypoint(wp: Waypoint) {
    if (this.activeRoute().waypoints.some((w) => w.lat === wp.lat && w.lng === wp.lng)) return;
    await this.patchActiveRoute((r) => ({ ...r, waypoints: [...r.waypoints, wp] }));
  }

  async removeWaypoint(index: number) {
    await this.patchActiveRoute((r) => ({ ...r, waypoints: r.waypoints.filter((_, i) => i !== index), info: null }));
    this.clearRouteLayer(this.activeRouteId());
  }

  async toggleAvoidTolls(checked: boolean) {
    await this.patchActiveRoute((r) => ({ ...r, options: { ...r.options, avoidTolls: checked } }));
  }

  async reorderWaypoints(event: CdkDragDrop<Waypoint[]>) {
    const wps = [...this.activeRoute().waypoints];
    moveItemInArray(wps, event.previousIndex, event.currentIndex);
    await this.patchActiveRoute((r) => ({ ...r, waypoints: wps, info: null }));
    this.clearRouteLayer(this.activeRouteId());
  }

  async clearRoute() {
    await this.patchActiveRoute((r) => ({ ...r, waypoints: [], info: null }));
    this.clearRouteLayer(this.activeRouteId());
  }

  private async patchActiveRoute(fn: (r: Route) => Route) {
    const id = this.activeRouteId();
    const route = this.activeRoute();
    if (!id || !route.id) return;
    const patched = fn(route);
    await this.routeService.update(id, {
      waypoints: patched.waypoints,
      options: patched.options,
      info: patched.info
    });
  }

  private clearRouteLayer(routeId: string) {
    this.routeLayers.get(routeId)?.remove();
    this.routeLayers.delete(routeId);
    this.routeTooltips.get(routeId)?.remove();
    this.routeTooltips.delete(routeId);
    this.renderedWaypointHashes.delete(routeId);
  }

  async calculateRoute() {
    const route = this.activeRoute();
    if (route.waypoints.length < 2) return;
    this.routeLoading.set(true);

    try {
      const data = await this.drawRoute(route);
      if (data) {
        const osrm = data.routes[0];
        await this.patchActiveRoute((r) => ({ ...r, info: { distance: osrm.distance, duration: osrm.duration } }));
        const layer = this.routeLayers.get(route.id);
        if (layer) this.map.fitBounds(layer.getBounds(), { padding: [40, 40] });
      } else {
        this.snackBar.open($localize`:@@map.routeCalculationFailed:Не вдалося розрахувати маршрут`, $localize`:@@common.ok:OK`, { duration: 3000 });
      }
    } catch {
      this.snackBar.open($localize`:@@map.routeCalculationError:Помилка розрахунку маршруту`, $localize`:@@common.ok:OK`, { duration: 3000 });
    } finally {
      this.routeLoading.set(false);
    }
  }

  // ── KML import ────────────────────────────────────────────────────────────

  async importKml() {
    this.kmlImporting.set(true);
    try {
      const filename = 'June 26 Dolomites Italy.kml';
      const kmlText  = await (await fetch(`/assets/${encodeURIComponent(filename)}`)).text();

      // Strip the default KML namespace so querySelectorAll works with plain tag names
      const stripped = kmlText.replace(/\sxmlns(?::\w+)?="[^"]*"/g, '');
      const doc      = new DOMParser().parseFromString(stripped, 'application/xml');

      const existing = this.mapPoints();
      const toImport: { label: string; lat: number; lng: number; color: string }[] = [];

      for (const pm of Array.from(doc.querySelectorAll('Placemark'))) {
        const pointEl = pm.querySelector('Point');
        if (!pointEl) continue; // skip LineStrings and LineString placemarks

        const label  = pm.querySelector('name')?.textContent?.trim() ?? $localize`:@@common.unnamed:Без назви`;
        const coords = pointEl.querySelector('coordinates')?.textContent?.trim() ?? '';
        const [lngStr, latStr] = coords.split(',');
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);
        if (isNaN(lat) || isNaN(lng)) continue;

        // Color is encoded in the style ID: "icon-1899-7CB342-labelson" → #7CB342
        const styleUrl   = pm.querySelector('styleUrl')?.textContent?.trim() ?? '';
        const colorMatch = styleUrl.match(/icon-\d+-([0-9A-Fa-f]{6})/i);
        const color      = colorMatch ? `#${colorMatch[1].toUpperCase()}` : randomPoiColor();

        // Deduplicate by coordinates (5-decimal precision ≈ 1 m tolerance)
        const isDup = existing.some(
          p => Math.abs(p.lat - lat) < 0.00001 && Math.abs(p.lng - lng) < 0.00001
        );
        if (isDup) continue;

        toImport.push({ label, lat, lng, color });
      }

      if (!toImport.length) {
        this.snackBar.open($localize`:@@map.allPointsImported:Усі точки вже імпортовано`, $localize`:@@common.ok:OK`, { duration: 3000 });
        return;
      }

      await Promise.all(toImport.map(p => this.mapPointService.add(p)));
      this.snackBar.open(
        $localize`:@@map.importedPoints:Імпортовано точок: ${toImport.length}:pointsCount:`,
        $localize`:@@common.ok:OK`, { duration: 3500 }
      );
    } catch {
      this.snackBar.open($localize`:@@map.kmlImportFailed:Не вдалося імпортувати KML`, $localize`:@@common.ok:OK`, { duration: 3000 });
    } finally {
      this.kmlImporting.set(false);
    }
  }

  ngOnDestroy() {
    this.cancelEdit();
    this.routeLayers.forEach((_, id) => this.clearRouteLayer(id));
    this.map?.remove();
  }

  addModeTooltip(): string {
    return this.addMode()
      ? $localize`:@@common.cancel:Скасувати`
      : $localize`:@@map.addPoiTooltip:Додати точку (натисніть на карту)`;
  }

  editRepositionTooltip(): string {
    return this.editReposition()
      ? $localize`:@@map.cancelReposition:Скасувати переміщення`
      : $localize`:@@map.clickMapToReposition:Натисніть на карту, щоб перемістити`;
  }

  sidebarTooltip(): string {
    return this.sidebarOpen()
      ? $localize`:@@map.hidePanel:Сховати панель`
      : $localize`:@@map.showPanel:Показати панель`;
  }
}

// ── Icon factories ─────────────────────────────────────────────────────────────

function mkDivIcon(html: string, size: number): L.DivIcon {
  return L.divIcon({ className: '', html, iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}

function poiIcon(color: string) {
  return mkDivIcon(`<div class="lmap-marker lmap-poi" style="background:${sanitizeColor(color)}"></div>`, 16);
}
function pendingIcon(color: string) {
  return mkDivIcon(`<div class="lmap-marker lmap-pending" style="background:${sanitizeColor(color)}"></div>`, 16);
}
function editIcon() {
  return mkDivIcon('<div class="lmap-marker lmap-edit"></div>', 20);
}
function searchIcon() {
  return mkDivIcon('<div class="lmap-marker lmap-search"></div>', 18);
}
function waypointIcon(index: number, color: string) {
  return mkDivIcon(`<div class="lmap-marker lmap-waypoint" style="background:${sanitizeColor(color)}">${index + 1}</div>`, 24);
}

function poiPopupHtml(point: MapPoint): string {
  const addToRoute = $localize`:@@map.addToRoute:Додати до маршруту`;
  const deleteLabel = $localize`:@@common.delete:Видалити`;

  return `<div class="lmap-popup">
    <strong>${escapeHtml(point.label)}</strong>
    <div class="lmap-popup-actions">
      <button id="rte-poi-${escapeHtml(point.id)}" class="lmap-popup-btn">+ ${escapeHtml(addToRoute)}</button>
      <button id="del-poi-${escapeHtml(point.id)}" class="lmap-popup-btn lmap-popup-btn--danger">${escapeHtml(deleteLabel)}</button>
    </div>
  </div>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeColor(color: string): string {
  return /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#f57c00';
}
