/**
 * AI Page 動態互動功能
 * 提供搜尋、篩選、排序、動畫等純前端互動功能
 */

// ==================== 全局 JavaScript 函數庫 ====================

export const GlobalScripts = `
<script>
// ==================== 1. 頁面內搜尋功能 ====================
function initPageSearch(inputId, targetSelector) {
  const searchInput = document.getElementById(inputId);
  if (!searchInput) return;

  searchInput.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const items = document.querySelectorAll(targetSelector);

    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      if (text.includes(searchTerm)) {
        item.style.display = '';
        item.style.animation = 'fadeIn 0.3s ease';
      } else {
        item.style.display = 'none';
      }
    });
  });
}

// ==================== 2. 篩選功能 ====================
function initFilters(formId, itemSelector, attributeGetter) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener('change', function() {
    const formData = new FormData(form);
    const filters = {};

    for (let [key, value] of formData.entries()) {
      if (!filters[key]) filters[key] = [];
      filters[key].push(value);
    }

    const items = document.querySelectorAll(itemSelector);

    items.forEach(item => {
      let shouldShow = true;

      for (let [filterKey, filterValues] of Object.entries(filters)) {
        if (filterValues.length === 0) continue;

        const itemValue = attributeGetter(item, filterKey);
        if (!filterValues.includes(itemValue)) {
          shouldShow = false;
          break;
        }
      }

      item.style.display = shouldShow ? '' : 'none';
      if (shouldShow) {
        item.style.animation = 'fadeIn 0.3s ease';
      }
    });
  });
}

// ==================== 3. 排序功能 ====================
function initSort(selectId, containerSelector, itemSelector, getterFn) {
  const select = document.getElementById(selectId);
  const container = document.querySelector(containerSelector);

  if (!select || !container) return;

  select.addEventListener('change', function(e) {
    const sortBy = e.target.value;
    const items = Array.from(container.querySelectorAll(itemSelector));

    items.sort((a, b) => {
      const valA = getterFn(a, sortBy);
      const valB = getterFn(b, sortBy);

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortBy.includes('desc') ? valB - valA : valA - valB;
      }

      return sortBy.includes('desc')
        ? String(valB).localeCompare(String(valA))
        : String(valA).localeCompare(String(valB));
    });

    items.forEach((item, index) => {
      item.style.order = index;
      item.style.animation = 'slideIn 0.4s ease';
    });

    container.style.display = 'flex';
    container.style.flexDirection = 'column';
  });
}

// ==================== 4. 價格範圍篩選 ====================
function initPriceFilter(minId, maxId, itemSelector, priceGetter) {
  const minInput = document.getElementById(minId);
  const maxInput = document.getElementById(maxId);

  if (!minInput || !maxInput) return;

  function filterByPrice() {
    const min = parseFloat(minInput.value) || 0;
    const max = parseFloat(maxInput.value) || Infinity;

    const items = document.querySelectorAll(itemSelector);

    items.forEach(item => {
      const price = priceGetter(item);

      if (price >= min && price <= max) {
        item.style.display = '';
        item.style.animation = 'fadeIn 0.3s ease';
      } else {
        item.style.display = 'none';
      }
    });
  }

  minInput.addEventListener('input', filterByPrice);
  maxInput.addEventListener('input', filterByPrice);
}

// ==================== 5. 願望清單功能 ====================
function initWishlist() {
  const WISHLIST_KEY = 'user_wishlist';

  function getWishlist() {
    const data = localStorage.getItem(WISHLIST_KEY);
    return data ? JSON.parse(data) : [];
  }

  function saveWishlist(items) {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
  }

  function addToWishlist(productId, productData) {
    const wishlist = getWishlist();
    if (!wishlist.find(item => item.id === productId)) {
      wishlist.push({ id: productId, ...productData, addedAt: new Date().toISOString() });
      saveWishlist(wishlist);
      showNotification('已加入願望清單 ❤️', 'success');
      return true;
    }
    return false;
  }

  function removeFromWishlist(productId) {
    const wishlist = getWishlist();
    const filtered = wishlist.filter(item => item.id !== productId);
    saveWishlist(filtered);
    showNotification('已從願望清單移除', 'info');
  }

  function isInWishlist(productId) {
    return getWishlist().some(item => item.id === productId);
  }

  window.wishlist = {
    get: getWishlist,
    add: addToWishlist,
    remove: removeFromWishlist,
    has: isInWishlist
  };
}

// ==================== 6. 通知系統 ====================
function showNotification(message, type = 'info') {
  const colors = {
    success: '#27ae60',
    error: '#e74c3c',
    warning: '#f39c12',
    info: '#667eea'
  };

  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = \`
    position: fixed;
    top: 20px;
    right: 20px;
    background: \${colors[type] || colors.info};
    color: white;
    padding: 1em 1.5em;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    animation: slideInRight 0.3s ease, slideOutRight 0.3s ease 2.7s;
    font-weight: 600;
  \`;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// ==================== 7. 模態框功能 ====================
function showModal(title, content) {
  const modal = document.createElement('div');
  modal.style.cssText = \`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.3s ease;
  \`;

  modal.innerHTML = \`
    <div style="
      background: white;
      border-radius: 12px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      animation: scaleIn 0.3s ease;
    ">
      <div style="
        padding: 1.5em 2em;
        border-bottom: 2px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <h2 style="margin: 0; color: #2c3e50; font-size: 1.5em;">\${title}</h2>
        <button onclick="this.closest('.modal-overlay').remove()" style="
          background: none;
          border: none;
          font-size: 1.5em;
          cursor: pointer;
          color: #7f8c8d;
          transition: color 0.3s ease;
        " onmouseover="this.style.color='#e74c3c'" onmouseout="this.style.color='#7f8c8d'">✕</button>
      </div>
      <div style="padding: 2em;">
        \${content}
      </div>
    </div>
  \`;

  modal.className = 'modal-overlay';
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.remove();
    }
  });

  document.body.appendChild(modal);
  return modal;
}

// ==================== 8. 比較功能 ====================
function initComparison() {
  const COMPARE_KEY = 'product_comparison';

  function getCompareList() {
    const data = localStorage.getItem(COMPARE_KEY);
    return data ? JSON.parse(data) : [];
  }

  function saveCompareList(items) {
    localStorage.setItem(COMPARE_KEY, JSON.stringify(items));
  }

  function addToCompare(productId, productData) {
    const compareList = getCompareList();

    if (compareList.length >= 4) {
      showNotification('最多只能比較 4 個商品', 'warning');
      return false;
    }

    if (!compareList.find(item => item.id === productId)) {
      compareList.push({ id: productId, ...productData });
      saveCompareList(compareList);
      showNotification(\`已加入比較 (\${compareList.length}/4)\`, 'success');
      return true;
    }

    return false;
  }

  function removeFromCompare(productId) {
    const compareList = getCompareList();
    const filtered = compareList.filter(item => item.id !== productId);
    saveCompareList(filtered);
  }

  window.compare = {
    get: getCompareList,
    add: addToCompare,
    remove: removeFromCompare
  };
}

// ==================== 9. 平滑滾動 ====================
function smoothScroll(targetId) {
  const element = document.getElementById(targetId);
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

// ==================== 10. 載入更多功能 ====================
function initLoadMore(buttonId, itemSelector, initialCount = 10, increment = 10) {
  const button = document.getElementById(buttonId);
  if (!button) return;

  const items = document.querySelectorAll(itemSelector);
  let visibleCount = initialCount;

  // 初始隱藏
  items.forEach((item, index) => {
    if (index >= visibleCount) {
      item.style.display = 'none';
    }
  });

  button.addEventListener('click', function() {
    const currentlyHidden = Array.from(items).filter(item => item.style.display === 'none');
    const toShow = currentlyHidden.slice(0, increment);

    toShow.forEach(item => {
      item.style.display = '';
      item.style.animation = 'fadeIn 0.5s ease';
    });

    visibleCount += increment;

    if (visibleCount >= items.length) {
      button.style.display = 'none';
    }

    button.textContent = \`載入更多 (\${Math.min(items.length - visibleCount, increment)} 項)\`;
  });

  if (items.length <= initialCount) {
    button.style.display = 'none';
  } else {
    button.textContent = \`載入更多 (\${Math.min(items.length - visibleCount, increment)} 項)\`;
  }
}

// ==================== 初始化所有功能 ====================
document.addEventListener('DOMContentLoaded', function() {
  initWishlist();
  initComparison();

  // 可以在這裡自動初始化其他功能
  // 例如：initPageSearch('search-input', '.book-card');
});
</script>
`;

// ==================== CSS 動畫 ====================

export const GlobalStyles = `
<style>
/* ==================== 動畫定義 ==================== */

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-10px);
  }
  75% {
    transform: translateX(10px);
  }
}

/* ==================== 實用樣式類 ==================== */

.fade-in {
  animation: fadeIn 0.5s ease;
}

.slide-in {
  animation: slideIn 0.5s ease;
}

.pulse {
  animation: pulse 1s ease infinite;
}

/* Hover 效果 */
.hover-lift {
  transition: all 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.hover-scale {
  transition: transform 0.3s ease;
}

.hover-scale:hover {
  transform: scale(1.05);
}

/* 響應式設計 */
@media (max-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)) !important;
  }

  .book-card {
    flex-direction: column !important;
  }

  .book-card img {
    margin-bottom: 1em;
  }

  .filter-panel {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    background: white;
    overflow-y: auto;
  }
}

/* 載入動畫 */
.loading {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(102, 126, 234, 0.3);
  border-radius: 50%;
  border-top-color: #667eea;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 骨架屏 */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s ease-in-out infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 滾動條美化 */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 5px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
}

/* 工具提示 */
.tooltip {
  position: relative;
  cursor: help;
}

.tooltip::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #2c3e50;
  color: white;
  padding: 0.5em 1em;
  border-radius: 6px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  font-size: 0.9em;
  margin-bottom: 5px;
}

.tooltip:hover::after {
  opacity: 1;
}

/* 徽章 */
.badge {
  display: inline-block;
  padding: 0.3em 0.6em;
  border-radius: 12px;
  font-size: 0.85em;
  font-weight: 600;
  line-height: 1;
}

.badge-new {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.badge-hot {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
}

.badge-sale {
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  color: white;
}
</style>
`;

// ==================== 互動組件生成器 ====================

export interface SearchBarInteractiveProps {
  placeholder?: string;
  targetSelector: string;
}

export function createInteractiveSearchBar(props: SearchBarInteractiveProps): string {
  const { placeholder = '搜尋...', targetSelector } = props;

  return `
${GlobalStyles}
${GlobalScripts}

<div style="margin: 2em 0;">
  <input
    type="text"
    id="page-search-input"
    placeholder="${placeholder}"
    style="
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      display: block;
      padding: 1em 1.5em;
      border: 2px solid #e0e0e0;
      border-radius: 50px;
      font-size: 1.05em;
      outline: none;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    "
    onfocus="this.style.borderColor='#667eea'; this.style.boxShadow='0 6px 16px rgba(102,126,234,0.2)';"
    onblur="this.style.borderColor='#e0e0e0'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.05)';"
  />
</div>

<script>
initPageSearch('page-search-input', '${targetSelector}');
</script>
  `;
}

export interface PriceRangeFilterProps {
  minPlaceholder?: string;
  maxPlaceholder?: string;
  itemSelector: string;
}

export function createPriceRangeFilter(props: PriceRangeFilterProps): string {
  const {
    minPlaceholder = '最低價格',
    maxPlaceholder = '最高價格',
    itemSelector,
  } = props;

  return `
${GlobalStyles}
${GlobalScripts}

<div style="
  background: white;
  padding: 1.5em;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  margin: 2em 0;
">
  <h3 style="color: #2c3e50; margin-bottom: 1em; font-size: 1.2em;">價格範圍</h3>

  <div style="display: flex; gap: 1em; align-items: center;">
    <input
      type="number"
      id="price-min"
      placeholder="${minPlaceholder}"
      style="
        flex: 1;
        padding: 0.8em;
        border: 2px solid #e0e0e0;
        border-radius: 6px;
        font-size: 1em;
        outline: none;
      "
    />
    <span style="color: #7f8c8d;">—</span>
    <input
      type="number"
      id="price-max"
      placeholder="${maxPlaceholder}"
      style="
        flex: 1;
        padding: 0.8em;
        border: 2px solid #e0e0e0;
        border-radius: 6px;
        font-size: 1em;
        outline: none;
      "
    />
  </div>
</div>

<script>
initPriceFilter('price-min', 'price-max', '${itemSelector}', function(item) {
  const priceText = item.querySelector('[data-price]')?.getAttribute('data-price');
  return parseFloat(priceText) || 0;
});
</script>
  `;
}

export interface LoadMoreButtonProps {
  initialCount?: number;
  increment?: number;
  itemSelector: string;
}

export function createLoadMoreButton(props: LoadMoreButtonProps): string {
  const { initialCount = 10, increment = 10, itemSelector } = props;

  return `
${GlobalStyles}
${GlobalScripts}

<div style="text-align: center; margin: 2em 0;">
  <button
    id="load-more-btn"
    style="
      padding: 1em 3em;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 1.1em;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    "
    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(102, 126, 234, 0.4)';"
    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.3)';"
  >
    載入更多
  </button>
</div>

<script>
initLoadMore('load-more-btn', '${itemSelector}', ${initialCount}, ${increment});
</script>
  `;
}

// ==================== 完整互動頁面包裝器 ====================

export function wrapWithInteractiveFeatures(content: string): string {
  return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${GlobalStyles}
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 20px; background: #f8f9fa;">
  <div style="max-width: 1200px; margin: 0 auto; background: white; padding: 2em; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    ${content}
  </div>
  ${GlobalScripts}
</body>
</html>
  `;
}

// ==================== 導出 ====================

export const InteractiveFeatures = {
  GlobalScripts,
  GlobalStyles,
  createInteractiveSearchBar,
  createPriceRangeFilter,
  createLoadMoreButton,
  wrapWithInteractiveFeatures,
};

export default InteractiveFeatures;
