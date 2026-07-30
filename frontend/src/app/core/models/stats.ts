export interface StatsOverview {
    totalListings: number;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
}

export interface CityStat {
    _id: string;
    count: number;
    avgPrice: number;
}

export interface BrandStat {
    brand: string;
    count: number;
}

export interface Stats {
    overview: Partial<StatsOverview>;
    byCity: CityStat[];
    byBrand: BrandStat[];
}
