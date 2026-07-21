import type { Hotel, RequestHotel } from './hotel';
import type { HotelRow } from './api/hotel-row';
import type { MapPointRow } from './api/map-point-row';
import type { RouteRow } from './api/route-row';
import type { StopRow } from './api/stop-row';
import type { TagRow } from './api/tag-row';
import type { MapPoint } from './map-point';
import type { Route } from './route';
import type { RequestStop, Stop } from './stop';
import type { Tag } from './tag';

export const mapTag = (row: TagRow): Tag => ({
  id: row.id, name: row.name, color: row.color ?? undefined,
  createdBy: row.created_by, createdAt: row.created_at, updatedAt: row.updated_at,
});

export const mapHotel = (row: HotelRow): Hotel => ({
  id: row.id, name: row.name, where: row.where, imageSrc: row.image_src,
  link: row.link ?? undefined, checkIn: row.check_in, checkOut: row.check_out,
  comment: row.comment ?? undefined, mapLink: row.map_link ?? undefined,
  tagId: row.tag_id ?? undefined, stopId: row.stop_id ?? undefined,
});

export const mapMapPoint = (row: MapPointRow): MapPoint => ({
  id: row.id, label: row.label, lat: row.lat, lng: row.lng,
  color: row.color ?? undefined, createdBy: row.created_by,
  createdAt: row.created_at, updatedAt: row.updated_at,
});

export const mapRoute = (row: RouteRow): Route => ({
  id: row.id, name: row.name, color: row.color, waypoints: row.waypoints,
  options: row.options, info: row.info, createdBy: row.created_by,
  createdAt: row.created_at, updatedAt: row.updated_at,
});

export const mapStop = (row: StopRow): Stop => ({
  id: row.id, where: row.where, datetime: row.datetime, comment: row.comment,
  goal: row.goal, mapLink: row.map_link, lat: row.lat, lng: row.lng,
  tagIds: row.stop_tags?.map((tag) => tag.tag_id), createdBy: row.created_by,
  createdAt: row.created_at, updatedAt: row.updated_at,
});

export function hotelWriteModel(hotel: Partial<RequestHotel>) {
  return {
    ...(hotel.name !== undefined && { name: hotel.name }), ...(hotel.where !== undefined && { where: hotel.where }),
    ...(hotel.imageSrc !== undefined && { image_src: hotel.imageSrc }), ...(hotel.link !== undefined && { link: hotel.link }),
    ...(hotel.checkIn !== undefined && { check_in: hotel.checkIn }), ...(hotel.checkOut !== undefined && { check_out: hotel.checkOut }),
    ...(hotel.comment !== undefined && { comment: hotel.comment }), ...(hotel.mapLink !== undefined && { map_link: hotel.mapLink }),
    ...(hotel.tagId !== undefined && { tag_id: hotel.tagId || null }), ...(hotel.stopId !== undefined && { stop_id: hotel.stopId || null }),
  };
}

export function stopWriteModel(stop: Partial<RequestStop & Stop>) {
  return {
    ...(stop.where !== undefined && { where: stop.where }), ...(stop.datetime !== undefined && { datetime: stop.datetime }),
    ...(stop.comment !== undefined && { comment: stop.comment }), ...(stop.goal !== undefined && { goal: stop.goal }),
    ...(stop.mapLink !== undefined && { map_link: stop.mapLink }), ...(stop.lat !== undefined && { lat: stop.lat }),
    ...(stop.lng !== undefined && { lng: stop.lng }), ...(stop.tagIds !== undefined && { tag_ids: stop.tagIds }),
  };
}
