<template>
  <div class="space-y-6">
    
    <!-- Top Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-white tracking-tight">
          Nastavení bytu, pokojů a správa členů
        </h1>
        <p class="text-xs text-slate-400 mt-0.5">
          Konfigurace kmenových údajů, kalkulačních klíčů a podlahových výměr v m² pro spravedlivé rozpočítání.
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <button
          @click="resetDemoData"
          class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
        >
          Resetovat data prototypu
        </button>

        <button
          @click="saveAll"
          class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-all hover:scale-102"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M5 13l4 4L19 7" />
          </svg>
          <span>Uložit veškeré změny</span>
        </button>
      </div>
    </div>

    <!-- 4 Administration Sections -->
    <div class="space-y-6">
      
      <!-- Section 1: Core Apartment Details -->
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
        <div class="flex items-center gap-2 pb-1 border-b border-slate-800">
          <span class="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">1</span>
          <h2 class="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Kmenové údaje domácnosti & bankovní spojení správce
          </h2>
        </div>

        <!-- Banner for non-manager members -->
        <div 
          v-if="!isMasterTenant"
          class="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-200 flex items-center gap-2.5"
        >
          <svg class="w-4 h-4 text-sky-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Prohlížíte aplikaci jako spolubydlící (<strong>{{ currentUser.name }}</strong>). Kmenové parametry bytu a bankovní účet spravuje <strong>{{ managerRoommate.name }}</strong>.
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label class="block text-slate-300 mb-1 font-medium">Název bytu *</label>
            <input
              v-model="formSettings.name"
              type="text"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-slate-300 mb-1 font-medium">Adresa nemovitosti *</label>
            <input
              v-model="formSettings.address"
              type="text"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-slate-300 mb-1 font-medium">Číslo bankovního účtu správce *</label>
            <input
              v-model="formSettings.accountNumber"
              type="text"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-slate-300 mb-1 font-medium">Kód IBAN *</label>
            <input
              v-model="formSettings.iban"
              type="text"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-slate-300 mb-1 font-medium">Fixní nájemné majiteli (CZK/měsíc) *</label>
            <input
              v-model.number="formSettings.monthlyRent"
              type="number"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-slate-300 mb-1 font-medium">Měsíční zálohy na energie a služby (CZK/měsíc) *</label>
            <input
              v-model.number="formSettings.monthlyUtilities"
              type="number"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <!-- Section 2: Rooms and m² Area -->
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
        <div class="flex items-center justify-between pb-1 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">2</span>
            <h2 class="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Pokoje a podlahová výměra v m² (Klíč pro rozpočítávání)
            </h2>
          </div>
        </div>

        <div class="border border-slate-800 rounded-xl overflow-hidden bg-slate-850">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-800/80 text-slate-300 border-b border-slate-700">
              <tr>
                <th class="py-2.5 px-3.5 font-semibold">Název pokoje</th>
                <th class="py-2.5 px-3.5 font-semibold">Přiřazený spolubydlící</th>
                <th class="py-2.5 px-3.5 font-semibold text-center">Plocha (m²)</th>
                <th class="py-2.5 px-3.5 font-semibold text-right">Podíl na bytě</th>
                <th class="py-2.5 px-3.5 font-semibold text-right">Akce</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              <tr 
                v-for="r in roommates" 
                :key="r.id" 
                :class="r.id === currentUser.id ? 'bg-emerald-500/10 font-medium' : 'hover:bg-slate-800/50 transition-colors'"
              >
                <td class="py-2.5 px-3.5 font-medium text-slate-200">
                  <span>{{ r.roomName }}</span>
                  <span v-if="r.id === currentUser.id" class="text-emerald-400 text-[10px] ml-1.5 font-bold">[Váš pokoj]</span>
                </td>
                <td class="py-2.5 px-3.5 text-slate-300">
                  <div class="flex items-center gap-2">
                    <span 
                      class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      :class="r.avatarColor"
                    >
                      {{ r.avatarInitial }}
                    </span>
                    <span>{{ r.name }}</span>
                    <span v-if="r.id === currentUser.id" class="text-[10px] text-emerald-400 font-semibold">[Vy]</span>
                    <span v-else-if="r.role === 'Správce'" class="text-[10px] text-emerald-400 font-semibold">[Správce]</span>
                  </div>
                </td>
                <td class="py-2.5 px-3.5 text-center">
                  <input
                    type="number"
                    v-model.number="r.roomAreaM2"
                    step="0.5"
                    min="5"
                    @change="updateRoommateArea(r.id, r.roomAreaM2)"
                    class="w-20 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono font-bold text-center focus:ring-1 focus:ring-emerald-400 focus:outline-none"
                  />
                  <span class="ml-1 text-slate-400">m²</span>
                </td>
                <td class="py-2.5 px-3.5 text-right font-mono font-bold text-emerald-400">
                  {{ r.areaSharePct }} %
                </td>
                <td class="py-2.5 px-3.5 text-right">
                  <span class="text-[11px] text-slate-500">Aktivní</span>
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-slate-900 font-semibold text-slate-300 border-t border-slate-800">
              <tr>
                <td class="py-2.5 px-3.5">KONTROLNÍ SOUČET:</td>
                <td class="py-2.5 px-3.5">4 obytné pokoje</td>
                <td class="py-2.5 px-3.5 text-center font-mono font-bold text-slate-100">{{ totalApartmentArea }} m²</td>
                <td class="py-2.5 px-3.5 text-right font-mono font-bold text-emerald-400">100.0 %</td>
                <td class="py-2.5 px-3.5 text-right text-emerald-400 font-bold text-[11px]">✓ V pořádku</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Section 3: Roommates Management -->
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
        <div class="flex items-center justify-between pb-1 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">3</span>
            <h2 class="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Seznam členů domácnosti a kontakty
            </h2>
          </div>
          <button
            @click="inviteMember"
            class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Pozvat spolubydlícího</span>
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div 
            v-for="r in roommates" 
            :key="r.id"
            class="p-3.5 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <div 
                class="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white"
                :class="r.avatarColor"
              >
                {{ r.avatarInitial }}
              </div>
              <div>
                <div class="font-bold text-slate-100 flex items-center gap-1.5">
                  <span>{{ r.name }}</span>
                  <span 
                    class="px-1.5 py-0.2 rounded text-[10px]"
                    :class="r.role === 'Správce' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'bg-slate-800 text-slate-400'"
                  >
                    {{ r.role }}
                  </span>
                </div>
                <div class="text-[11px] text-slate-400 mt-0.5">{{ r.email }}</div>
                <div class="text-[10px] text-slate-500 font-mono">{{ r.phone }}</div>
              </div>
            </div>

            <div class="text-right">
              <span class="text-xs font-mono font-bold text-slate-300 block">{{ r.roomName.split(' ')[0] }}</span>
              <span class="text-[10px] text-slate-400">{{ r.roomAreaM2 }} m²</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 4: Calculation Rules -->
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
        <div class="flex items-center gap-2 pb-1 border-b border-slate-800">
          <span class="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">4</span>
          <h2 class="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Výchozí pravidla kalkulace nákladů
          </h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div class="p-3.5 rounded-xl bg-slate-850 border border-slate-800 space-y-2">
            <span class="font-bold text-slate-200 block">Klíč pro fixní nájemné:</span>
            <label class="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input type="radio" v-model="formSettings.rules.rentKey" value="BY_AREA" class="text-emerald-500" />
              <span>Poměrem dle m² pokoje</span>
            </label>
            <label class="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input type="radio" v-model="formSettings.rules.rentKey" value="EQUAL" class="text-emerald-500" />
              <span>Rovným dílem mezi všechny</span>
            </label>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-850 border border-slate-800 space-y-2">
            <span class="font-bold text-slate-200 block">Klíč pro energie a internet:</span>
            <label class="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input type="radio" v-model="formSettings.rules.energyKey" value="EQUAL" class="text-emerald-500" />
              <span>Rovným dílem mezi členy</span>
            </label>
            <label class="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input type="radio" v-model="formSettings.rules.energyKey" value="BY_AREA" class="text-emerald-500" />
              <span>Poměrem dle m² pokoje</span>
            </label>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-850 border border-slate-800 space-y-2">
            <span class="font-bold text-slate-200 block">Klíč pro drogerii a úklid:</span>
            <label class="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input type="radio" v-model="formSettings.rules.suppliesKey" value="EQUAL" class="text-emerald-500" />
              <span>Rovným dílem mezi zúčastněné</span>
            </label>
          </div>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useSpolubyt } from '../composables/useSpolubyt'

const { 
  settings, 
  roommates, 
  currentUser,
  isMasterTenant,
  managerRoommate,
  saveApartmentSettings, 
  updateRoommateArea, 
  resetDemoData, 
  showToast 
} = useSpolubyt()

const formSettings = reactive(JSON.parse(JSON.stringify(settings.value)))

const totalApartmentArea = computed(() => {
  return roommates.value.reduce((sum, r) => sum + r.roomAreaM2, 0)
})

const saveAll = () => {
  saveApartmentSettings(formSettings)
}

const inviteMember = () => {
  showToast(
    'Pozvánka odeslána',
    'Simulovaný e-mail s pozvánkou k připojení do bytu byl vygenerován.',
    'info'
  )
}
</script>

