/**
 * AI Page 模板組件系統
 * 提供預先設計好的組件，讓 AI 可以像拼積木一樣組裝頁面
 */
export interface BookCard {
    title: string;
    author: string;
    imageUrl: string;
    detailUrl: string;
    price?: string;
    description?: string;
    reason?: string;
}
export interface HeroSection {
    title: string;
    subtitle?: string;
    content: string;
}
/**
 * Hero Section 組件
 */
export declare function createHeroSection(data: HeroSection): string;
/**
 * 書籍卡片組件（美化版，帶陰影和懸停效果）
 */
export declare function createBookCard(book: BookCard): string;
/**
 * 書籍列表容器
 */
export declare function createBookList(books: BookCard[], title?: string): string;
/**
 * 分類區塊 - 用於組織不同類別的書籍
 */
export interface CategorySection {
    categoryName: string;
    icon?: string;
    books: BookCard[];
    description?: string;
}
export declare function createCategorySection(section: CategorySection): string;
/**
 * 多分類書籍推薦頁面
 */
export declare function createMultiCategoryBookPage(data: {
    hero: HeroSection;
    categories: CategorySection[];
    additionalInfo?: string;
    relatedTopics?: string[];
}): string;
/**
 * 提示框組件
 */
export declare function createInfoBox(content: string, type?: 'info' | 'warning' | 'success'): string;
/**
 * 標籤組件
 */
export declare function createTag(text: string, color?: string): string;
/**
 * 分隔線組件
 */
export declare function createDivider(): string;
/**
 * 完整的書籍推薦頁面模板
 */
export declare function createBookRecommendationPage(data: {
    hero: HeroSection;
    books: BookCard[];
    additionalInfo?: string;
    relatedTopics?: string[];
}): string;
/**
 * 訂單詳情頁面模板（示例）
 */
export declare function createOrderDetailPage(data: {
    orderId: string;
    status: string;
    items: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    totalAmount: number;
    recipient: {
        name: string;
        phone: string;
        address: string;
    };
}): string;
