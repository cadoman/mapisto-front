import { Observable, from } from "rxjs";
import { MapistoTerritory } from "interfaces/mapistoTerritory";
import { MapistoState } from "interfaces/mapistoState";
import axios from 'axios'
import { config } from "config";
import { MapistoStateRaw } from "./MapistoStateRaw";
import { map } from "rxjs/operators";
import { MapistoTerritoryRaw } from "./MapistoTerritoryRaw";
import { Land } from "interfaces/Land";
import { LandRaw } from "./LandRaw";


export function loadStates(
    year: number,
    precisionLevel: number,
    min_x: number,
    max_x: number,
    min_y: number,
    max_y: number
): Observable<MapistoState[]> {
    return from(
        axios.get<MapistoStateRaw[]>(`${config.api_path}/map`, {
            params: {
                date: year + "-01-01",
                precision_in_km: precisionLevel,
                min_x: min_x,
                max_x: max_x,
                min_y: min_y,
                max_y: max_y
            }
        })
    ).pipe(
        map(res => res.data),
        map(res => res.map(stateRaw => parseState(stateRaw, precisionLevel)))
    )
}

export function loadLands(
    precisionLevel: number,
    min_x: number,
    max_x: number,
    min_y: number,
    max_y: number
): Observable<Land[]> {
    return from(
        axios.get<LandRaw[]>(`${config.api_path}/land`, {
            params: {
                precision_in_km: precisionLevel,
                min_x: min_x,
                max_x: max_x,
                min_y: min_y,
                max_y: max_y

            }
        })
    ).pipe(
        map(res => res.data),
        map(lands => lands.map(raw => parseLand(raw, precisionLevel)))
    )
}

function parseLand(raw : LandRaw, precision_level : number) : Land{
    return {
        ...raw,
        precision_level : precision_level
    }
}

function parseState(raw: MapistoStateRaw, precision_level: number): MapistoState {
    return {
        ...raw,
        validity_start: new Date(raw.validity_start + "Z"),
        validity_end: new Date(raw.validity_end + "Z"),
        territories: raw.territories.map(territoryRaw => parseTerritory(territoryRaw, precision_level))
    }
}

function parseTerritory(raw: MapistoTerritoryRaw, precision_level: number): MapistoTerritory {
    if (!raw.validity_start || !raw.validity_end) {
        console.error("Missing validity on territory")
        console.error(raw)
    }
    return {
        ...raw,
        validity_start: new Date(raw.validity_start + "Z"),
        validity_end: new Date(raw.validity_end + "Z"),
        precision_level: precision_level
    }
}

