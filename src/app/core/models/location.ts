export interface LocationDTO {
    locationId: number;
    canonicalName: string;
    displayAlias: string;
}

export interface AdminLocationDTO {
    locationId: number;
    name: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AdminLocationAliasDTO {
    aliasId: number;
    alias: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
