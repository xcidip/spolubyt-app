<template>
  <div class="space-y-6">
    
    <!-- Top Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-2xl font-extrabold text-white tracking-tight">
            {{ t('cart.title', 'Společný nákupní košík bytu') }}
          </h1>
          <span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold font-mono">
            {{ t('cart.remainingBadge', '{count} ks zbývá', { count: cartRemainingCount }) }}
          </span>
        </div>
        <p class="text-xs text-slate-400 mt-0.5">
          {{ t('cart.subtitle', 'Společný seznam nákupů (drogerie, úklidové pomůcky, káva) s okamžitým přepočtem ceny v reálném čase.') }}
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <button type="button"
          v-if="cartItems.length > 0"
          @click="clearCart"
          class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-rose-300 text-xs font-semibold border border-slate-700 transition-colors"
        >
          {{ t('cart.clearCart', 'Vysypat košík') }}
        </button>

        <button type="button"
          @click="convertRemainingCartToExpense"
          :disabled="cartRemainingCount === 0"
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M5 13l4 4L19 7" />
          </svg>
          <span>{{ t('cart.convertRemaining', 'Převést zbývající na výdaj ({price} CZK)', { price: cartRemainingPrice.toLocaleString('cs-CZ') }) }}</span>
        </button>
      </div>
    </div>

    <!-- Content Grid: Items List & Add item + Summary -->
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
      
      <!-- Left Column: Interactive Items Table -->
      <div class="xl:col-span-8 min-w-0 space-y-4">
        
        <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold text-slate-100">
              {{ t('cart.itemsTitle', 'Položky v nákupním košíku') }}
            </h2>
            <span class="text-xs text-slate-400">{{ t('cart.instantRecalc', 'Okamžitý přepočet součtů') }}</span>
          </div>

          <!-- Table of items -->
          <div class="border border-slate-800 rounded-xl overflow-x-auto bg-slate-850" tabindex="0" role="region" :aria-label="t('cart.tableAriaLabel', 'Položky nákupního košíku')">
            <p class="px-3 pt-2 text-xs text-slate-400 md:hidden">{{ t('cart.scrollHint', 'Tabulku lze posouvat vodorovně →') }}</p>
            <table class="w-full min-w-[600px] text-left text-xs">
              <thead class="bg-slate-800/80 text-slate-300 border-b border-slate-700">
                <tr>
                  <th class="py-3 pl-4 pr-3 font-semibold">{{ t('cart.thItem', 'Položka') }}</th>
                  <th class="py-3 px-3 font-semibold">{{ t('cart.thCategory', 'Kategorie') }}</th>
                  <th class="py-3 px-3 font-semibold text-center whitespace-nowrap">{{ t('cart.thQty', 'Počet kusů') }}</th>
                  <th class="py-3 px-3 font-semibold text-right whitespace-nowrap">{{ t('cart.thUnitPrice', 'Cena / ks') }}</th>
                  <th class="py-3 px-3 font-semibold text-right whitespace-nowrap">{{ t('cart.thSubtotal', 'Mezisoučet') }}</th>
                  <th class="py-3 pl-3 pr-4 font-semibold text-right">{{ t('cart.thActions', 'Akce') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800">
                <tr 
                  v-for="item in cartItems" 
                  :key="item.id"
                  class="hover:bg-slate-800/50 transition-colors"
                  :class="item.isPurchased ? 'bg-slate-900/60' : ''"
                >
                  <!-- Item name, toggle checkbox & who added / purchased -->
                  <td class="py-3 pl-4 pr-3 min-w-[170px]">
                    <div class="flex items-center gap-2.5">
                      <button
                        type="button"
                        @click="toggleCartItemPurchased(item.id)"
                        class="w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0"
                        :class="item.isPurchased ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-950/40' : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700 hover:border-slate-600'"
                        :title="item.isPurchased ? t('cart.unmarkPurchased', 'Zrušit označení koupeno') : t('cart.markPurchased', 'Označit jako koupeno')"
                        :aria-label="item.isPurchased ? t('cart.unmarkPurchased', 'Zrušit označení koupeno') : t('cart.markPurchased', 'Označit jako koupeno')"
                      >
                        <svg v-if="item.isPurchased" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <div class="min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span :class="item.isPurchased ? 'line-through text-slate-400' : 'text-slate-100'" class="font-bold">
                            {{ item.name }}
                          </span>
                          <span
                            v-if="item.isPurchased"
                            class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold"
                          >
                            {{ t('cart.purchasedBadge', 'Koupeno') }}
                          </span>
                        </div>
                        <div class="text-xs text-slate-400 mt-0.5 leading-relaxed">
                          <span class="whitespace-nowrap">{{ t('cart.addedBy', 'Přidal(a): {name}', { name: item.addedBy }) }}</span>
                          <span class="whitespace-nowrap"> • {{ item.addedAt }}</span>
                          <span
                            v-if="item.isPurchased && item.purchasedBy"
                            class="text-emerald-400 font-medium whitespace-nowrap"
                          >
                            • {{ t('cart.purchasedBy', 'Koupil(a): {name} ({date})', { name: item.purchasedBy, date: item.purchasedAt || t('cart.purchasedUnknown', 'koupeno') }) }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <!-- Category -->
                  <td class="py-3 px-3 whitespace-nowrap">
                    <span class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700">
                      {{ t('categories.' + item.category, item.category) }}
                    </span>
                  </td>

                  <!-- Quantity +/- buttons (Interactive state recalculation!) -->
                  <td class="py-3 px-3 text-center whitespace-nowrap">
                    <div class="inline-flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl p-1">
                      <button type="button"
                        @click="updateCartItemQty(item.id, -1)"
                        class="w-6 h-6 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center justify-center font-bold text-xs transition-colors"
                        :title="t('cart.removeOne', 'Odebrat 1 kus')"
                        :aria-label="t('cart.removeOne', 'Odebrat 1 kus')"
                      >
                        -
                      </button>
                      <span class="w-7 text-center font-mono font-bold text-slate-100 text-xs tabular-nums">
                        {{ item.qty }}
                      </span>
                      <button type="button"
                        @click="updateCartItemQty(item.id, 1)"
                        class="w-6 h-6 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center justify-center font-bold text-xs transition-colors"
                        :title="t('cart.addOne', 'Přidat 1 kus')"
                        :aria-label="t('cart.addOne', 'Přidat 1 kus')"
                      >
                        +
                      </button>
                    </div>
                  </td>

                  <!-- Unit price -->
                  <td class="py-3 px-3 text-right font-mono text-slate-300 whitespace-nowrap tabular-nums">
                    {{ item.unitPrice.toLocaleString('cs-CZ') }} <span class="text-xs text-slate-400">CZK</span>
                  </td>

                  <!-- Subtotal (qty * unitPrice) -->
                  <td class="py-3 px-3 text-right font-mono font-bold text-emerald-400 text-sm whitespace-nowrap tabular-nums">
                    {{ (item.unitPrice * item.qty).toLocaleString('cs-CZ') }} <span class="text-xs font-semibold text-emerald-500/70">CZK</span>
                  </td>

                  <!-- Actions: Převést do výdajů and Remove -->
                  <td class="py-3 pl-3 pr-4 text-right whitespace-nowrap">
                    <div class="flex items-center justify-end gap-1">
                      <button
                        v-if="item.isPurchased"
                        @click="convertCartItemToExpense(item)"
                        type="button"
                        class="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1 shrink-0 hover:bg-emerald-500/20"
                        :title="t('cart.convertItemTitle', 'Převést tuto položku přímo do výdajů bytu')"
                        :aria-label="t('cart.convertItemTitle', 'Převést tuto položku přímo do výdajů bytu')"
                      >
                        <span class="hidden 2xl:inline">{{ t('cart.convertItem', 'Převést do výdajů') }}</span>
                        <span class="2xl:hidden">{{ t('cart.convertItemShort', 'Do výdajů') }}</span>
                        <svg class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>

                      <button type="button"
                        @click="removeCartItem(item.id)"
                        class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                        :title="t('cart.removeItem', 'Odebrat z košíku')"
                        :aria-label="t('cart.removeItem', 'Odebrat z košíku')"
                      >
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- Empty Cart State -->
                <tr v-if="cartItems.length === 0">
                  <td colspan="6" class="py-12 text-center text-slate-400">
                    <div class="space-y-2">
                      <p class="text-sm font-semibold text-slate-300">{{ t('cart.emptyTitle', 'Váš společný nákupní košík je prázdný.') }}</p>
                      <p class="text-xs text-slate-400">{{ t('cart.emptyHint', 'Pomocí formuláře vpravo přidejte věci, které v bytě chybí.') }}</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

      </div>

      <!-- Right Column: Add Item Form & Total Summary Card -->
      <div class="xl:col-span-4 space-y-6">
        
        <!-- Add Item Form -->
        <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
          <div class="flex items-center gap-2">
            <span class="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">+</span>
            <h2 class="text-xs font-bold text-slate-200">
              {{ t('cart.addTitle', 'Přidat položku do košíku') }}
            </h2>
          </div>

          <form @submit.prevent="handleAddItem" class="space-y-3 text-xs">
            <div>
              <label for="cartview-field-1" class="block text-slate-300 mb-1 font-medium">{{ t('cart.nameLabel', 'Název položky *') }}</label>
              <input id="cartview-field-1"
                v-model="newItem.name"
                type="text"
                required
                :placeholder="t('cart.namePlaceholder', 'např. Jar na nádobí, olivový olej, žárovka...')"
                class="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
              />
            </div>

            <div class="grid grid-cols-2 gap-2.5">
              <div>
                <label for="cartview-field-2" class="block text-slate-300 mb-1 font-medium">{{ t('cart.priceLabel', 'Cena / ks *') }}</label>
                <div class="relative">
                  <input id="cartview-field-2"
                    v-model.number="newItem.unitPrice"
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="0"
                    class="w-full pl-3 pr-8 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                  />
                  <span class="absolute right-2.5 top-2 text-xs text-slate-400 font-bold">CZK</span>
                </div>
              </div>

              <div>
                <label for="cartview-field-3" class="block text-slate-300 mb-1 font-medium">{{ t('cart.qtyLabel', 'Počet kusů *') }}</label>
                <input id="cartview-field-3"
                  v-model.number="newItem.qty"
                  type="number"
                  min="1"
                  step="1"
                  required
                  placeholder="1"
                  class="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label for="cartview-field-4" class="block text-slate-300 mb-1 font-medium">{{ t('cart.categoryLabel', 'Kategorie') }}</label>
              <select id="cartview-field-4"
                v-model="newItem.category"
                class="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
              >
                <option value="Drogerie">{{ t('cart.categoryDrogerie', 'Drogerie a úklid') }}</option>
                <option value="Jídlo">{{ t('cart.categoryFood', 'Potraviny a káva') }}</option>
                <option value="Údržba">{{ t('cart.categoryMaintenance', 'Údržba bytu') }}</option>
                <option value="Služby">{{ t('cart.categoryServices', 'Služby a ostatní') }}</option>
              </select>
            </div>

            <button
              type="submit"
              class="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>{{ t('cart.submit', 'Vložit do nákupního košíku') }}</span>
            </button>
          </form>
        </div>

        <!-- Summary Card -->
        <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
          <h2 class="text-xs font-bold text-slate-400">
            {{ t('cart.summaryTitle', 'Rekapitulace košíku') }}
          </h2>

          <div class="space-y-2.5 text-xs">
            <div class="flex justify-between text-slate-300">
              <span>{{ t('cart.totalCountLabel', 'Celkový počet kusů:') }}</span>
              <span class="font-mono font-bold text-slate-100">{{ t('cart.countValue', '{count} ks', { count: cartTotalCount }) }}</span>
            </div>
            <div class="flex justify-between text-slate-300">
              <span>{{ t('cart.remainingLabel', 'Zbývá nakoupit:') }}</span>
              <span class="font-mono font-bold text-amber-300">{{ t('cart.countValue', '{count} ks', { count: cartRemainingCount }) }}</span>
            </div>
            <div class="flex justify-between text-slate-300">
              <span>{{ t('cart.itemsCountLabel', 'Položek celkem:') }}</span>
              <span class="font-mono font-bold text-slate-100">{{ t('cart.kindsValue', '{count} druhů', { count: cartItems.length }) }}</span>
            </div>
            <div class="flex justify-between items-baseline gap-3 text-slate-300">
              <span class="min-w-0">{{ t('cart.sharePerMember', 'Odhadovaný podíl na 1 člena (zbývá):') }}</span>
              <span class="font-mono font-bold text-emerald-400 whitespace-nowrap">
                {{ Math.round(cartRemainingPrice / 4).toLocaleString('cs-CZ') }} CZK
              </span>
            </div>
            
            <div class="pt-3 border-t border-slate-800 flex justify-between items-baseline gap-3">
              <span class="text-sm font-bold text-white min-w-0">{{ t('cart.totalPriceLabel', 'Celková cena nákupu:') }}</span>
              <span class="text-xl font-mono font-extrabold text-slate-100 whitespace-nowrap">
                {{ cartTotalPrice.toLocaleString('cs-CZ') }} CZK
              </span>
            </div>
            <div class="flex justify-between items-baseline gap-3">
              <span class="text-sm font-bold text-amber-300 min-w-0">{{ t('cart.remainingLabel', 'Zbývá nakoupit:') }}</span>
              <span class="text-xl font-mono font-extrabold text-amber-300 whitespace-nowrap">
                {{ cartRemainingPrice.toLocaleString('cs-CZ') }} CZK
              </span>
            </div>
          </div>

          <button type="button"
            @click="convertRemainingCartToExpense"
            :disabled="cartRemainingCount === 0"
            class="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all text-center whitespace-nowrap"
          >
            {{ t('cart.createExpense', 'Vytvořit společný výdaj ze zbývajícího nákupu →') }}
          </button>
        </div>

      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useSpolubyt } from '../composables/useSpolubyt'
import { ExpenseCategory } from '../types'
import { t } from '../i18n'

const { 
  cartItems, 
  cartTotalCount, 
  cartTotalPrice, 
  cartRemainingCount,
  cartRemainingPrice,
  addCartItem, 
  updateCartItemQty, 
  removeCartItem, 
  clearCart, 
  convertRemainingCartToExpense,
  convertCartItemToExpense,
  toggleCartItemPurchased
} = useSpolubyt()

const newItem = reactive({
  name: '',
  category: 'Drogerie' as ExpenseCategory,
  unitPrice: 89,
  qty: 1
})

const handleAddItem = () => {
  addCartItem({
    name: newItem.name,
    category: newItem.category,
    unitPrice: newItem.unitPrice,
    qty: newItem.qty
  })

  // Reset form
  newItem.name = ''
  newItem.unitPrice = 89
  newItem.qty = 1
}
</script>


