<template>
  <div class="space-y-6">
    
    <!-- Top Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-2xl font-extrabold text-white tracking-tight">
            Společný nákupní košík bytu
          </h1>
          <span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold font-mono">
            {{ cartTotalCount }} kusů
          </span>
        </div>
        <p class="text-xs text-slate-400 mt-0.5">
          Společný seznam nákupů (drogerie, úklidové pomůcky, káva) s okamžitým přepočtem ceny v reálném čase.
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <button
          v-if="cartItems.length > 0"
          @click="clearCart"
          class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-rose-300 text-xs font-semibold border border-slate-700 transition-colors"
        >
          Vysypat košík
        </button>

        <button
          @click="convertCartToExpense"
          :disabled="cartItems.length === 0"
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-102"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M5 13l4 4L19 7" />
          </svg>
          <span>Převést na společný výdaj ({{ cartTotalPrice.toLocaleString('cs-CZ') }} CZK)</span>
        </button>
      </div>
    </div>

    <!-- Content Grid: Items List & Add item + Summary -->
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
      
      <!-- Left Column: Interactive Items Table -->
      <div class="xl:col-span-8 min-w-0 space-y-4">
        
        <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Položky v nákupním košíku
            </h2>
            <span class="text-xs text-slate-400">Okamžitý přepočet součtů</span>
          </div>

          <!-- Table of items -->
          <div class="border border-slate-800 rounded-xl overflow-x-auto bg-slate-850">
            <table class="w-full min-w-[600px] text-left text-xs">
              <thead class="bg-slate-800/80 text-slate-300 border-b border-slate-700">
                <tr>
                  <th class="py-3 pl-4 pr-3 font-semibold">Položka</th>
                  <th class="py-3 px-3 font-semibold">Kategorie</th>
                  <th class="py-3 px-3 font-semibold text-center whitespace-nowrap">Počet kusů</th>
                  <th class="py-3 px-3 font-semibold text-right whitespace-nowrap">Cena / ks</th>
                  <th class="py-3 px-3 font-semibold text-right whitespace-nowrap">Mezisoučet</th>
                  <th class="py-3 pl-3 pr-4 font-semibold text-right">Akce</th>
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
                        :title="item.isPurchased ? 'Zrušit označení koupeno' : 'Označit jako koupeno'"
                        :aria-label="item.isPurchased ? 'Zrušit označení koupeno' : 'Označit jako koupeno'"
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
                            class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold"
                          >
                            Koupeno
                          </span>
                        </div>
                        <div class="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                          <span class="whitespace-nowrap">Přidal(a): {{ item.addedBy }}</span>
                          <span class="whitespace-nowrap"> • {{ item.addedAt }}</span>
                          <span
                            v-if="item.isPurchased && item.purchasedBy"
                            class="text-emerald-400 font-medium whitespace-nowrap"
                          >
                            • Koupil(a): {{ item.purchasedBy }} ({{ item.purchasedAt || 'koupeno' }})
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <!-- Category -->
                  <td class="py-3 px-3 whitespace-nowrap">
                    <span class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-semibold border border-slate-700">
                      {{ item.category }}
                    </span>
                  </td>

                  <!-- Quantity +/- buttons (Interactive state recalculation!) -->
                  <td class="py-3 px-3 text-center whitespace-nowrap">
                    <div class="inline-flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl p-1">
                      <button
                        @click="updateCartItemQty(item.id, -1)"
                        class="w-6 h-6 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center justify-center font-bold text-xs transition-colors"
                        title="Odebrat 1 kus"
                        aria-label="Odebrat 1 kus"
                      >
                        -
                      </button>
                      <span class="w-7 text-center font-mono font-bold text-slate-100 text-xs tabular-nums">
                        {{ item.qty }}
                      </span>
                      <button
                        @click="updateCartItemQty(item.id, 1)"
                        class="w-6 h-6 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center justify-center font-bold text-xs transition-colors"
                        title="Přidat 1 kus"
                        aria-label="Přidat 1 kus"
                      >
                        +
                      </button>
                    </div>
                  </td>

                  <!-- Unit price -->
                  <td class="py-3 px-3 text-right font-mono text-slate-300 whitespace-nowrap tabular-nums">
                    {{ item.unitPrice.toLocaleString('cs-CZ') }} <span class="text-[10px] text-slate-500">CZK</span>
                  </td>

                  <!-- Subtotal (qty * unitPrice) -->
                  <td class="py-3 px-3 text-right font-mono font-bold text-emerald-400 text-sm whitespace-nowrap tabular-nums">
                    {{ (item.unitPrice * item.qty).toLocaleString('cs-CZ') }} <span class="text-[10px] font-semibold text-emerald-500/70">CZK</span>
                  </td>

                  <!-- Actions: Převést do výdajů and Remove -->
                  <td class="py-3 pl-3 pr-4 text-right whitespace-nowrap">
                    <div class="flex items-center justify-end gap-1">
                      <button
                        v-if="item.isPurchased"
                        @click="convertCartItemToExpense(item)"
                        type="button"
                        class="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] font-bold shadow-md shadow-emerald-950/40 transition-all flex items-center gap-1 shrink-0"
                        title="Převést tuto položku přímo do výdajů bytu"
                        aria-label="Převést tuto položku přímo do výdajů bytu"
                      >
                        <span class="hidden 2xl:inline">Převést do výdajů</span>
                        <span class="2xl:hidden">Do výdajů</span>
                        <svg class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>

                      <button
                        @click="removeCartItem(item.id)"
                        class="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                        title="Odebrat z košíku"
                        aria-label="Odebrat z košíku"
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
                      <p class="text-sm font-semibold text-slate-300">Váš společný nákupní košík je prázdný.</p>
                      <p class="text-xs text-slate-500">Pomocí formuláře vpravo přidejte věci, které v bytě chybí.</p>
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
            <h2 class="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Přidat položku do košíku
            </h2>
          </div>

          <form @submit.prevent="handleAddItem" class="space-y-3 text-xs">
            <div>
              <label class="block text-slate-300 mb-1 font-medium">Název položky *</label>
              <input
                v-model="newItem.name"
                type="text"
                required
                placeholder="např. Jar na nádobí, olivový olej, žárovka..."
                class="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
              />
            </div>

            <div class="grid grid-cols-2 gap-2.5">
              <div>
                <label class="block text-slate-300 mb-1 font-medium">Cena / ks *</label>
                <div class="relative">
                  <input
                    v-model.number="newItem.unitPrice"
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="0"
                    class="w-full pl-3 pr-8 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                  />
                  <span class="absolute right-2.5 top-2 text-[10px] text-slate-400 font-bold">CZK</span>
                </div>
              </div>

              <div>
                <label class="block text-slate-300 mb-1 font-medium">Počet kusů *</label>
                <input
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
              <label class="block text-slate-300 mb-1 font-medium">Kategorie</label>
              <select
                v-model="newItem.category"
                class="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
              >
                <option value="Drogerie">Drogerie a úklid</option>
                <option value="Jídlo">Potraviny a káva</option>
                <option value="Údržba">Údržba bytu</option>
                <option value="Služby">Služby a ostatní</option>
              </select>
            </div>

            <button
              type="submit"
              class="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Vložit do nákupního košíku</span>
            </button>
          </form>
        </div>

        <!-- Summary Card -->
        <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
          <h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Rekapitulace košíku
          </h2>

          <div class="space-y-2.5 text-xs">
            <div class="flex justify-between text-slate-300">
              <span>Celkový počet kusů:</span>
              <span class="font-mono font-bold text-slate-100">{{ cartTotalCount }} ks</span>
            </div>
            <div class="flex justify-between text-slate-300">
              <span>Položek celkem:</span>
              <span class="font-mono font-bold text-slate-100">{{ cartItems.length }} druhů</span>
            </div>
            <div class="flex justify-between items-baseline gap-3 text-slate-300">
              <span class="min-w-0">Odhadovaný podíl na 1 člena:</span>
              <span class="font-mono font-bold text-emerald-400 whitespace-nowrap">
                {{ Math.round(cartTotalPrice / 4).toLocaleString('cs-CZ') }} CZK
              </span>
            </div>
            
            <div class="pt-3 border-t border-slate-800 flex justify-between items-baseline gap-3">
              <span class="text-sm font-bold text-white min-w-0">Celková cena nákupu:</span>
              <span class="text-xl font-mono font-extrabold text-emerald-400 whitespace-nowrap">
                {{ cartTotalPrice.toLocaleString('cs-CZ') }} CZK
              </span>
            </div>
          </div>

          <button
            @click="convertCartToExpense"
            :disabled="cartItems.length === 0"
            class="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-center whitespace-nowrap"
          >
            Vytvořit společný výdaj z košíku →
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

const { 
  cartItems, 
  cartTotalCount, 
  cartTotalPrice, 
  addCartItem, 
  updateCartItemQty, 
  removeCartItem, 
  clearCart, 
  convertCartToExpense,
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


