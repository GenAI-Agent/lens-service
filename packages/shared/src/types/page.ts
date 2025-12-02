/**
 * Lens Service v3 - Page Generation Types
 */

// ============================================================================
// Page Types
// ============================================================================

export interface GeneratedPage {
  id: string;
  title: string;
  blocks: PageBlockData[];
  theme: PageTheme;
  html: string;
  css?: string;
  metadata: PageMetadata;
  createdAt: Date;
  expiresAt?: Date;
  viewCount: number;
  createdBy: string;
}

export interface PageMetadata {
  description?: string;
  keywords?: string[];
  ogImage?: string;
  canonical?: string;
  customData?: Record<string, unknown>;
}

export type PageTheme = 'light' | 'dark' | 'colorful' | 'minimal' | 'custom';

// ============================================================================
// Block Types
// ============================================================================

export interface PageBlockData {
  id: string;
  type: BlockType;
  props: BlockProps;
  order: number;
}

export type BlockType =
  | 'hero'
  | 'product-grid'
  | 'product-card'
  | 'product-carousel'
  | 'testimonial'
  | 'testimonial-grid'
  | 'cta'
  | 'cta-banner'
  | 'text'
  | 'rich-text'
  | 'image'
  | 'image-gallery'
  | 'video'
  | 'comparison-table'
  | 'pricing-table'
  | 'faq'
  | 'accordion'
  | 'tabs'
  | 'features'
  | 'stats'
  | 'team'
  | 'contact-form'
  | 'newsletter'
  | 'social-links'
  | 'footer'
  | 'divider'
  | 'spacer'
  | 'custom-html';

export type BlockProps =
  | HeroBlockProps
  | ProductGridBlockProps
  | ProductCardBlockProps
  | TestimonialBlockProps
  | CTABlockProps
  | TextBlockProps
  | ImageBlockProps
  | VideoBlockProps
  | ComparisonTableBlockProps
  | FAQBlockProps
  | FeaturesBlockProps
  | StatsBlockProps
  | FooterBlockProps
  | CustomHTMLBlockProps;

// ============================================================================
// Individual Block Props
// ============================================================================

export interface HeroBlockProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  textColor?: string;
  alignment?: 'left' | 'center' | 'right';
  cta?: {
    text: string;
    link: string;
    style?: 'primary' | 'secondary' | 'outline';
  };
  secondaryCta?: {
    text: string;
    link: string;
  };
}

export interface ProductGridBlockProps {
  title?: string;
  subtitle?: string;
  products: ProductItem[];
  columns?: 2 | 3 | 4 | 5 | 6;
  showPrice?: boolean;
  showRating?: boolean;
  cardStyle?: 'default' | 'minimal' | 'detailed';
}

export interface ProductItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  image: string;
  link: string;
  rating?: number;
  reviewCount?: number;
  badge?: string;
  inStock?: boolean;
}

export interface ProductCardBlockProps {
  product: ProductItem;
  size?: 'small' | 'medium' | 'large';
  showDescription?: boolean;
  layout?: 'vertical' | 'horizontal';
}

export interface TestimonialBlockProps {
  quote: string;
  author: string;
  role?: string;
  company?: string;
  avatar?: string;
  rating?: number;
}

export interface CTABlockProps {
  title: string;
  description?: string;
  buttonText: string;
  buttonLink: string;
  backgroundColor?: string;
  textColor?: string;
  layout?: 'horizontal' | 'vertical';
}

export interface TextBlockProps {
  content: string;
  format?: 'plain' | 'markdown' | 'html';
  alignment?: 'left' | 'center' | 'right' | 'justify';
  fontSize?: 'small' | 'medium' | 'large';
}

export interface ImageBlockProps {
  src: string;
  alt: string;
  caption?: string;
  link?: string;
  width?: string;
  height?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
}

export interface VideoBlockProps {
  src: string;
  type: 'youtube' | 'vimeo' | 'mp4' | 'embed';
  title?: string;
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
}

export interface ComparisonTableBlockProps {
  title?: string;
  headers: string[];
  rows: ComparisonRow[];
  highlightColumn?: number;
}

export interface ComparisonRow {
  feature: string;
  values: (string | boolean | number)[];
  tooltip?: string;
}

export interface FAQBlockProps {
  title?: string;
  items: FAQItem[];
  expandFirstByDefault?: boolean;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FeaturesBlockProps {
  title?: string;
  subtitle?: string;
  features: FeatureItem[];
  layout?: 'grid' | 'list' | 'alternating';
  columns?: 2 | 3 | 4;
}

export interface FeatureItem {
  icon?: string;
  title: string;
  description: string;
  link?: string;
}

export interface StatsBlockProps {
  title?: string;
  stats: StatItem[];
  layout?: 'row' | 'grid';
}

export interface StatItem {
  value: string | number;
  label: string;
  prefix?: string;
  suffix?: string;
  icon?: string;
}

export interface FooterBlockProps {
  logo?: string;
  tagline?: string;
  links?: FooterLinkGroup[];
  socialLinks?: SocialLink[];
  copyright?: string;
  backgroundColor?: string;
}

export interface FooterLinkGroup {
  title: string;
  links: { text: string; href: string }[];
}

export interface SocialLink {
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok';
  url: string;
}

export interface CustomHTMLBlockProps {
  html: string;
  css?: string;
  sanitize?: boolean;
}

// ============================================================================
// Page Builder Types
// ============================================================================

export interface PageBuilderContext {
  theme: PageTheme;
  baseStyles: string;
  customStyles?: string;
}

export interface BlockRenderer {
  type: BlockType;
  render: (props: BlockProps, context: PageBuilderContext) => string;
  validate: (props: BlockProps) => ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// ============================================================================
// Page Storage Types
// ============================================================================

export interface PageStorageOptions {
  ttlSeconds?: number;
  public?: boolean;
  indexForSearch?: boolean;
}

export interface StoredPage {
  id: string;
  html: string;
  metadata: PageMetadata;
  createdAt: Date;
  expiresAt?: Date;
  accessCount: number;
}
