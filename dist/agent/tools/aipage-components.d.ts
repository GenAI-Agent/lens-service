/**
 * AI Page 積木式組件系統
 * 可重用的 UI 組件，讓 AI 像拼積木一樣組合頁面
 */
export interface BookCardData {
    title: string;
    author: string;
    imageUrl: string;
    detailUrl: string;
    price?: string;
    description?: string;
    reason?: string;
}
export declare function BookCard(props: BookCardData): string;
export interface PriceTagProps {
    currentPrice: number;
    originalPrice?: number;
    currency?: string;
    size?: 'small' | 'medium' | 'large';
}
export declare function PriceTag(props: PriceTagProps): string;
export interface AuthorBadgeProps {
    name: string;
    photoUrl?: string;
    profileUrl?: string;
}
export declare function AuthorBadge(props: AuthorBadgeProps): string;
export interface RatingStarsProps {
    rating: number;
    maxRating?: number;
    showNumber?: boolean;
    size?: 'small' | 'medium' | 'large';
}
export declare function RatingStars(props: RatingStarsProps): string;
export interface CategoryTagProps {
    label: string;
    color?: string;
    url?: string;
}
export declare function CategoryTag(props: CategoryTagProps): string;
export interface SearchBarProps {
    placeholder?: string;
    action?: string;
    width?: string;
}
export declare function SearchBar(props: SearchBarProps): string;
export interface FilterOption {
    label: string;
    value: string;
}
export interface FilterPanelProps {
    title: string;
    filters: Array<{
        name: string;
        label: string;
        options: FilterOption[];
    }>;
}
export declare function FilterPanel(props: FilterPanelProps): string;
export interface SortOption {
    label: string;
    value: string;
}
export interface SortDropdownProps {
    options: SortOption[];
    defaultValue?: string;
}
export declare function SortDropdown(props: SortDropdownProps): string;
export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    baseUrl: string;
}
export declare function Pagination(props: PaginationProps): string;
export interface ProductGridProps {
    books: BookCardData[];
    columns?: number;
}
export declare function ProductGrid(props: ProductGridProps): string;
export interface ComparisonItem {
    name: string;
    [key: string]: any;
}
export interface ComparisonTableProps {
    items: ComparisonItem[];
    attributes: Array<{
        key: string;
        label: string;
    }>;
}
export declare function ComparisonTable(props: ComparisonTableProps): string;
export interface ChartDataPoint {
    label: string;
    value: number;
}
export interface ChartWidgetProps {
    title: string;
    data: ChartDataPoint[];
    type: 'bar' | 'line' | 'pie';
}
export declare function ChartWidget(props: ChartWidgetProps): string;
export declare class ComponentComposer {
    private components;
    add(component: string): this;
    wrap(wrapper: string): this;
    build(): string;
}
export declare const Components: {
    BookCard: typeof BookCard;
    PriceTag: typeof PriceTag;
    AuthorBadge: typeof AuthorBadge;
    RatingStars: typeof RatingStars;
    CategoryTag: typeof CategoryTag;
    SearchBar: typeof SearchBar;
    FilterPanel: typeof FilterPanel;
    SortDropdown: typeof SortDropdown;
    Pagination: typeof Pagination;
    ProductGrid: typeof ProductGrid;
    ComparisonTable: typeof ComparisonTable;
    ChartWidget: typeof ChartWidget;
    ComponentComposer: typeof ComponentComposer;
};
export default Components;
