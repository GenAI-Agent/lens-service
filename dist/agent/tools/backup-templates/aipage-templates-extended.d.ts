/**
 * AI Page 擴展模板組件系統 - 16+ 種模板
 * 提供豐富的視覺化組件和互動功能
 */
import { BookCard, HeroSection } from './aipage-templates';
export interface ComparisonProduct {
    title: string;
    imageUrl: string;
    detailUrl: string;
    price: string;
    author: string;
    publisher: string;
    publishDate: string;
    pages?: number;
    rating?: number;
    features: string[];
    pros: string[];
    cons: string[];
}
export declare function createProductComparisonPage(data: {
    hero: HeroSection;
    products: ComparisonProduct[];
}): string;
export interface PriceData {
    productTitle: string;
    currentPrice: number;
    originalPrice: number;
    discount: number;
    priceHistory: Array<{
        date: string;
        price: number;
    }>;
    competitor: string;
    competitorPrice: number;
}
export declare function createPriceAnalysisPage(data: {
    hero: HeroSection;
    priceData: PriceData;
    recommendation: string;
}): string;
export interface AuthorProfile {
    name: string;
    photoUrl: string;
    bio: string;
    achievements: string[];
    awards: string[];
    books: BookCard[];
    quote: string;
    socialLinks?: {
        website?: string;
        facebook?: string;
        instagram?: string;
        twitter?: string;
    };
}
export declare function createAuthorProfilePage(data: {
    hero: HeroSection;
    author: AuthorProfile;
}): string;
export interface ReadingGuideStep {
    title: string;
    description: string;
    duration: string;
    books: BookCard[];
    tips: string[];
}
export declare function createReadingGuidePage(data: {
    hero: HeroSection;
    steps: ReadingGuideStep[];
    totalDuration: string;
}): string;
export interface BookReview {
    reviewerName: string;
    reviewerAvatar?: string;
    rating: number;
    date: string;
    summary: string;
    pros: string[];
    cons: string[];
    recommendation: string;
}
export declare function createBookReviewSummaryPage(data: {
    hero: HeroSection;
    book: BookCard;
    averageRating: number;
    totalReviews: number;
    reviews: BookReview[];
}): string;
export declare const EXTENDED_TEMPLATES: {
    'product-comparison': typeof createProductComparisonPage;
    'price-analysis': typeof createPriceAnalysisPage;
    'author-profile': typeof createAuthorProfilePage;
    'reading-guide': typeof createReadingGuidePage;
    'book-review-summary': typeof createBookReviewSummaryPage;
};
