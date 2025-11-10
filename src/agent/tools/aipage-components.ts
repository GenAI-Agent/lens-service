/**
 * AI Page 積木式組件系統
 * 可重用的 UI 組件，讓 AI 像拼積木一樣組合頁面
 */

// ==================== 基礎數據接口 ====================

export interface BookCardData {
  title: string;
  author: string;
  imageUrl: string;
  detailUrl: string;
  price?: string;
  description?: string;
  reason?: string;
}

// ==================== 1. BookCard 組件 ====================

export function BookCard(props: BookCardData): string {
  return `
<div class="book-card" style="
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
  margin-bottom: 1.5em;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 1.5em;
  border: 1px solid #f0f0f0;
" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 8px 30px rgba(0,0,0,0.12)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 20px rgba(0,0,0,0.08)';">
  <div style="flex-shrink: 0; margin-right: 1.5em;">
    <a href="${props.detailUrl}" target="_blank">
      <img src="${props.imageUrl}" alt="${props.title}" style="
        width: 120px;
        height: 180px;
        object-fit: cover;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      ">
    </a>
  </div>
  <div style="flex: 1;">
    <h3 style="font-size: 1.4em; margin-bottom: 0.5em; color: #2c3e50;">
      <a href="${props.detailUrl}" target="_blank" style="color: #667eea; text-decoration: none;">
        ${props.title}
      </a>
    </h3>
    <p style="color: #7f8c8d; margin-bottom: 0.8em;"><strong>作者：</strong>${props.author}</p>
    ${props.price ? `<p style="color: #e74c3c; font-size: 1.3em; font-weight: 700; margin-bottom: 0.8em;">${props.price}</p>` : ''}
    ${props.description ? `<p style="color: #555; line-height: 1.6; margin-bottom: 0.8em;">${props.description}</p>` : ''}
    ${props.reason ? `
    <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 0.8em 1em; border-radius: 4px; margin-top: 1em;">
      <strong>📚 推薦理由：</strong>${props.reason}
    </div>
    ` : ''}
    <a href="${props.detailUrl}" target="_blank" style="
      display: inline-block;
      margin-top: 1em;
      padding: 0.6em 1.5em;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
    ">查看詳情 →</a>
  </div>
</div>
  `;
}

// ==================== 2. PriceTag 組件 ====================

export interface PriceTagProps {
  currentPrice: number;
  originalPrice?: number;
  currency?: string;
  size?: 'small' | 'medium' | 'large';
}

export function PriceTag(props: PriceTagProps): string {
  const { currentPrice, originalPrice, currency = 'NT$', size = 'medium' } = props;

  const sizeStyles = {
    small: { current: '1em', original: '0.9em' },
    medium: { current: '1.3em', original: '1em' },
    large: { current: '2em', original: '1.2em' },
  };

  return `
<div class="price-tag" style="display: inline-flex; align-items: center; gap: 0.8em;">
  <span style="color: #e74c3c; font-size: ${sizeStyles[size].current}; font-weight: 700;">
    ${currency} ${currentPrice.toLocaleString()}
  </span>
  ${originalPrice && originalPrice > currentPrice ? `
  <span style="
    color: #95a5a6;
    font-size: ${sizeStyles[size].original};
    text-decoration: line-through;
  ">${currency} ${originalPrice.toLocaleString()}</span>
  <span style="
    background: #e74c3c;
    color: white;
    padding: 0.3em 0.6em;
    border-radius: 4px;
    font-size: 0.85em;
    font-weight: 600;
  ">-${Math.round((1 - currentPrice / originalPrice) * 100)}%</span>
  ` : ''}
</div>
  `;
}

// ==================== 3. AuthorBadge 組件 ====================

export interface AuthorBadgeProps {
  name: string;
  photoUrl?: string;
  profileUrl?: string;
}

export function AuthorBadge(props: AuthorBadgeProps): string {
  const content = `
<div style="display: flex; align-items: center; gap: 0.8em;">
  ${props.photoUrl ? `
  <img src="${props.photoUrl}" alt="${props.name}" style="
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #667eea;
  ">
  ` : `
  <div style="
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1.2em;
  ">${props.name.charAt(0)}</div>
  `}
  <span style="color: #2c3e50; font-weight: 600;">${props.name}</span>
</div>
  `;

  return props.profileUrl
    ? `<a href="${props.profileUrl}" target="_blank" style="text-decoration: none; color: inherit;">${content}</a>`
    : content;
}

// ==================== 4. RatingStars 組件 ====================

export interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  showNumber?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function RatingStars(props: RatingStarsProps): string {
  const { rating, maxRating = 5, showNumber = true, size = 'medium' } = props;

  const sizeMap = {
    small: '1em',
    medium: '1.3em',
    large: '1.8em',
  };

  const fullStars = Math.floor(rating);
  const emptyStars = maxRating - Math.ceil(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return `
<div class="rating-stars" style="display: inline-flex; align-items: center; gap: 0.5em;">
  <span style="color: #f39c12; font-size: ${sizeMap[size]};">
    ${'★'.repeat(fullStars)}${hasHalfStar ? '⯨' : ''}${'☆'.repeat(emptyStars)}
  </span>
  ${showNumber ? `<span style="color: #7f8c8d; font-size: 0.95em;">(${rating.toFixed(1)})</span>` : ''}
</div>
  `;
}

// ==================== 5. CategoryTag 組件 ====================

export interface CategoryTagProps {
  label: string;
  color?: string;
  url?: string;
}

export function CategoryTag(props: CategoryTagProps): string {
  const { label, color = '#667eea', url } = props;

  const tag = `
<span style="
  display: inline-block;
  background: ${color};
  color: white;
  padding: 0.4em 0.9em;
  border-radius: 20px;
  font-size: 0.9em;
  font-weight: 500;
  margin-right: 0.5em;
  margin-bottom: 0.5em;
  transition: all 0.3s ease;
" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
  ${label}
</span>
  `;

  return url ? `<a href="${url}" style="text-decoration: none;">${tag}</a>` : tag;
}

// ==================== 6. SearchBar 組件 ====================

export interface SearchBarProps {
  placeholder?: string;
  action?: string;
  width?: string;
}

export function SearchBar(props: SearchBarProps): string {
  const {
    placeholder = '搜尋書籍、作者...',
    action = '/find',
    width = '100%',
  } = props;

  return `
<form action="${action}" method="GET" style="width: ${width}; max-width: 600px; margin: 0 auto;">
  <div style="
    display: flex;
    background: white;
    border-radius: 50px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    overflow: hidden;
    border: 2px solid #e0e0e0;
    transition: all 0.3s ease;
  " onmouseover="this.style.borderColor='#667eea'; this.style.boxShadow='0 6px 24px rgba(102,126,234,0.2)';" onmouseout="this.style.borderColor='#e0e0e0'; this.style.boxShadow='0 4px 20px rgba(0,0,0,0.1)';">
    <input
      type="text"
      name="q"
      placeholder="${placeholder}"
      style="
        flex: 1;
        padding: 1em 1.5em;
        border: none;
        outline: none;
        font-size: 1.05em;
        color: #2c3e50;
      "
    />
    <button type="submit" style="
      padding: 1em 2em;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      cursor: pointer;
      font-weight: 600;
      font-size: 1.05em;
      transition: all 0.3s ease;
    " onmouseover="this.style.background='linear-gradient(135deg, #764ba2 0%, #667eea 100%)';" onmouseout="this.style.background='linear-gradient(135deg, #667eea 0%, #764ba2 100%)';">
      🔍 搜尋
    </button>
  </div>
</form>
  `;
}

// ==================== 7. FilterPanel 組件 ====================

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

export function FilterPanel(props: FilterPanelProps): string {
  return `
<div class="filter-panel" style="
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  padding: 1.5em;
  margin-bottom: 2em;
">
  <h3 style="color: #2c3e50; margin-bottom: 1.5em; font-size: 1.3em;">${props.title}</h3>

  ${props.filters.map(filter => `
  <div style="margin-bottom: 1.5em;">
    <label style="
      display: block;
      color: #7f8c8d;
      font-weight: 600;
      margin-bottom: 0.8em;
      font-size: 0.95em;
    ">${filter.label}</label>

    <div style="display: flex; flex-wrap: wrap; gap: 0.5em;">
      ${filter.options.map(opt => `
      <label style="
        display: inline-flex;
        align-items: center;
        padding: 0.5em 1em;
        background: #f8f9fa;
        border: 2px solid #e0e0e0;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s ease;
        user-select: none;
      " onmouseover="this.style.borderColor='#667eea'; this.style.background='#f0f4ff';" onmouseout="this.style.borderColor='#e0e0e0'; this.style.background='#f8f9fa';">
        <input type="checkbox" name="${filter.name}" value="${opt.value}" style="margin-right: 0.5em;">
        <span style="color: #2c3e50; font-size: 0.95em;">${opt.label}</span>
      </label>
      `).join('\n')}
    </div>
  </div>
  `).join('\n')}

  <div style="display: flex; gap: 1em; margin-top: 1.5em;">
    <button type="submit" style="
      flex: 1;
      padding: 0.8em;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    ">套用篩選</button>

    <button type="reset" style="
      padding: 0.8em 1.5em;
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      color: #7f8c8d;
    ">重設</button>
  </div>
</div>
  `;
}

// ==================== 8. SortDropdown 組件 ====================

export interface SortOption {
  label: string;
  value: string;
}

export interface SortDropdownProps {
  options: SortOption[];
  defaultValue?: string;
}

export function SortDropdown(props: SortDropdownProps): string {
  return `
<div class="sort-dropdown" style="display: inline-flex; align-items: center; gap: 0.8em;">
  <label style="color: #7f8c8d; font-weight: 600; font-size: 0.95em;">排序：</label>
  <select name="sort" style="
    padding: 0.6em 1.2em;
    border: 2px solid #e0e0e0;
    border-radius: 6px;
    background: white;
    color: #2c3e50;
    font-size: 1em;
    font-weight: 500;
    cursor: pointer;
    outline: none;
    transition: all 0.3s ease;
  " onmouseover="this.style.borderColor='#667eea';" onmouseout="this.style.borderColor='#e0e0e0';">
    ${props.options.map(opt => `
    <option value="${opt.value}" ${opt.value === props.defaultValue ? 'selected' : ''}>
      ${opt.label}
    </option>
    `).join('\n')}
  </select>
</div>
  `;
}

// ==================== 9. Pagination 組件 ====================

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export function Pagination(props: PaginationProps): string {
  const { currentPage, totalPages, baseUrl } = props;

  const pages: number[] = [];
  const maxVisible = 7;

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push(-1); // Ellipsis

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) pages.push(i);
    }

    if (currentPage < totalPages - 2) pages.push(-1); // Ellipsis
    pages.push(totalPages);
  }

  return `
<div class="pagination" style="
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5em;
  margin: 2em 0;
">
  ${currentPage > 1 ? `
  <a href="${baseUrl}?page=${currentPage - 1}" style="
    padding: 0.6em 1em;
    background: white;
    border: 2px solid #e0e0e0;
    border-radius: 6px;
    color: #2c3e50;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
  " onmouseover="this.style.borderColor='#667eea'; this.style.color='#667eea';" onmouseout="this.style.borderColor='#e0e0e0'; this.style.color='#2c3e50';">
    ← 上一頁
  </a>
  ` : ''}

  ${pages.map(page => {
    if (page === -1) {
      return `<span style="color: #7f8c8d; padding: 0 0.5em;">...</span>`;
    }

    const isActive = page === currentPage;
    return `
    <a href="${baseUrl}?page=${page}" style="
      padding: 0.6em 1em;
      background: ${isActive ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white'};
      border: 2px solid ${isActive ? '#667eea' : '#e0e0e0'};
      border-radius: 6px;
      color: ${isActive ? 'white' : '#2c3e50'};
      text-decoration: none;
      font-weight: 600;
      min-width: 40px;
      text-align: center;
      transition: all 0.3s ease;
      ${isActive ? '' : "onmouseover=\"this.style.borderColor='#667eea'; this.style.color='#667eea';\" onmouseout=\"this.style.borderColor='#e0e0e0'; this.style.color='#2c3e50';\""}
    ">${page}</a>
    `;
  }).join('\n')}

  ${currentPage < totalPages ? `
  <a href="${baseUrl}?page=${currentPage + 1}" style="
    padding: 0.6em 1em;
    background: white;
    border: 2px solid #e0e0e0;
    border-radius: 6px;
    color: #2c3e50;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
  " onmouseover="this.style.borderColor='#667eea'; this.style.color='#667eea';" onmouseout="this.style.borderColor='#e0e0e0'; this.style.color='#2c3e50';">
    下一頁 →
  </a>
  ` : ''}
</div>
  `;
}

// ==================== 10. ProductGrid 組件 ====================

export interface ProductGridProps {
  books: BookCardData[];
  columns?: number;
}

export function ProductGrid(props: ProductGridProps): string {
  const { books, columns = 3 } = props;

  return `
<div class="product-grid" style="
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(${columns === 4 ? '250px' : columns === 3 ? '280px' : '320px'}, 1fr));
  gap: 1.5em;
  margin: 2em 0;
">
  ${books.map(book => `
  <div style="
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    transition: all 0.3s ease;
  " onmouseover="this.style.transform='translateY(-8px)'; this.style.boxShadow='0 8px 30px rgba(0,0,0,0.15)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 20px rgba(0,0,0,0.08)';">
    <a href="${book.detailUrl}" target="_blank" style="text-decoration: none; color: inherit;">
      <img src="${book.imageUrl}" alt="${book.title}" style="
        width: 100%;
        height: 220px;
        object-fit: cover;
      ">
      <div style="padding: 1.5em;">
        <h3 style="
          font-size: 1.1em;
          margin-bottom: 0.5em;
          color: #2c3e50;
          line-height: 1.4;
          min-height: 2.8em;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        ">${book.title}</h3>
        <p style="color: #7f8c8d; font-size: 0.9em; margin-bottom: 1em;">${book.author}</p>
        ${book.price ? `<p style="color: #e74c3c; font-size: 1.2em; font-weight: 700;">${book.price}</p>` : ''}
      </div>
    </a>
  </div>
  `).join('\n')}
</div>
  `;
}

// ==================== 11. ComparisonTable 組件 ====================

export interface ComparisonItem {
  name: string;
  [key: string]: any;
}

export interface ComparisonTableProps {
  items: ComparisonItem[];
  attributes: Array<{ key: string; label: string }>;
}

export function ComparisonTable(props: ComparisonTableProps): string {
  return `
<div class="comparison-table" style="overflow-x: auto; margin: 2em 0;">
  <table style="
    width: 100%;
    border-collapse: collapse;
    background: white;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    border-radius: 12px;
    overflow: hidden;
  ">
    <thead>
      <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
        <th style="padding: 1.2em; text-align: left; font-size: 1.1em;">項目</th>
        ${props.items.map(item => `
        <th style="padding: 1.2em; text-align: center; font-size: 1.1em; min-width: 200px;">
          ${item.name}
        </th>
        `).join('')}
      </tr>
    </thead>
    <tbody>
      ${props.attributes.map((attr, index) => `
      <tr style="border-bottom: 1px solid #e0e0e0;">
        <td style="
          padding: 1.2em;
          background: #f8f9fa;
          font-weight: 600;
          color: #2c3e50;
        ">${attr.label}</td>
        ${props.items.map(item => `
        <td style="padding: 1.2em; text-align: center; color: #555;">
          ${item[attr.key] || 'N/A'}
        </td>
        `).join('')}
      </tr>
      `).join('\n')}
    </tbody>
  </table>
</div>
  `;
}

// ==================== 12. ChartWidget 組件 ====================

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface ChartWidgetProps {
  title: string;
  data: ChartDataPoint[];
  type: 'bar' | 'line' | 'pie';
}

export function ChartWidget(props: ChartWidgetProps): string {
  const { title, data, type } = props;
  const maxValue = Math.max(...data.map(d => d.value));

  if (type === 'bar') {
    return `
<div class="chart-widget" style="
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  padding: 2em;
  margin: 2em 0;
">
  <h3 style="color: #2c3e50; margin-bottom: 1.5em; font-size: 1.5em;">${title}</h3>

  <div style="display: flex; flex-direction: column; gap: 1em;">
    ${data.map(point => {
      const percentage = (point.value / maxValue * 100).toFixed(0);
      return `
      <div>
        <div style="
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5em;
          color: #2c3e50;
          font-weight: 600;
        ">
          <span>${point.label}</span>
          <span style="color: #667eea;">${point.value}</span>
        </div>
        <div style="
          background: #e0e0e0;
          height: 12px;
          border-radius: 6px;
          overflow: hidden;
        ">
          <div style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            height: 100%;
            width: ${percentage}%;
            border-radius: 6px;
            transition: width 0.5s ease;
          "></div>
        </div>
      </div>
      `;
    }).join('\n')}
  </div>
</div>
    `;
  }

  return `<div>Chart type "${type}" not yet implemented</div>`;
}

// ==================== 組件組合器 ====================

export class ComponentComposer {
  private components: string[] = [];

  add(component: string): this {
    this.components.push(component);
    return this;
  }

  wrap(wrapper: string): this {
    const wrapped = `<div>${this.components.join('\n')}</div>`;
    this.components = [wrapper.replace('{content}', wrapped)];
    return this;
  }

  build(): string {
    return this.components.join('\n');
  }
}

// ==================== 導出所有組件 ====================

export const Components = {
  BookCard,
  PriceTag,
  AuthorBadge,
  RatingStars,
  CategoryTag,
  SearchBar,
  FilterPanel,
  SortDropdown,
  Pagination,
  ProductGrid,
  ComparisonTable,
  ChartWidget,
  ComponentComposer,
};

export default Components;
