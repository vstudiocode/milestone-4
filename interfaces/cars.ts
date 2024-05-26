export interface Car {
    name: string;
    type: string;
    class: string;
    playstyle: Playstyle[];
    image: string;
}

export type Playstyle = "balanced" | "versatile" | "powerful" | "agile" | "fast" | "maneuverable" | "precise" | "quick" | "nimble" | "responsive" | "slick" | "stylish" | "solid" | "stable" | "aggressive" | "robust" | "commanding" | "fierce" | "compact" | "versatile" | "sleek" | "heavy" | "bulky" | "forceful" | "quirky" | "unpredictable" | "unique" | "aerodynamic" | "sleek";