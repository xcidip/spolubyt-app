<template>
  <div class="space-y-6">
    
    <!-- Top Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 text-xs font-semibold mb-1" :class="isMasterTenant ? 'text-emerald-400' : 'text-sky-400'">
          <span class="w-2 h-2 rounded-full animate-pulse" :class="isMasterTenant ? 'bg-emerald-500' : 'bg-sky-500'"></span>
          <span>{{ isMasterTenant ? t('settlement.badgeManager', 'Správa plateb a vyrovnání správce') : t('settlement.badgeMember', 'Přehled vyrovnání uživatele {name}', { name: currentUser.name }) }}</span>
        </div>
        <h1 class="text-2xl font-extrabold text-white tracking-tight">
          {{ t('settlement.title', 'Vyrovnání a matice vzájemných závazků') }}
        </h1>
        <p class="text-xs text-slate-400 mt-0.5">
          {{ t('settlement.periodLabel', 'Zúčtovací období:') }} <strong class="text-slate-200">{{ t('settlement.periodValue', 'Listopad 2026') }}</strong> • 
          <span v-if="isMasterTenant">
            {{ t('settlement.managerAccountLabel', 'Váš bankovní účet pro příjem plateb:') }} <span class="font-mono text-emerald-400">{{ settings.accountNumber }}</span>
          </span>
          <span v-else>
            {{ t('settlement.payerLabel', 'Příjemce plateb (správce):') }} <strong class="text-slate-200">{{ managerRoommate.name }}</strong> • {{ t('settlement.accountNumberLabel', 'Číslo účtu:') }} <span class="font-mono text-emerald-400">{{ settings.accountNumber.split(' ')[0] }}</span>
          </span>
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <button type="button"
          @click="showExportToast"
          class="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>{{ t('settlement.printPdf', 'Tisk / uložit PDF') }}</span>
        </button>
      </div>
    </div>

    <!-- 3 KPI Cards (User-perspective aware) -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      
      <!-- Card 1: Receivables (Manager) vs My Personal Debt (Member) -->
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
        <div class="text-xs font-bold text-slate-400 mb-1">
          {{ isMasterTenant ? t('settlement.card1TitleManager', 'Celkové pohledávky za bytem') : t('settlement.card1TitleMember', 'Můj celkový dluh správci') }}
        </div>
        <div 
          class="text-2xl font-mono font-extrabold"
          :class="[
            isMasterTenant ? 'text-emerald-400' :
            (isCurrentUserOverdue ? 'text-rose-400' : (currentUserDebt > 0 ? 'text-amber-400' : 'text-emerald-400'))
          ]"
        >
          {{ (isMasterTenant ? totalReceivables : currentUserDebt).toLocaleString('cs-CZ') }} CZK
        </div>
        <div class="text-xs text-slate-400 mt-2">
          <template v-if="isMasterTenant">
            {{ settlementDebtorsSummary }}
          </template>
          <template v-else-if="isCurrentUserOverdue">
            <span class="text-rose-400 font-semibold">⚠️ {{ currentUserOverdueText }} {{ t('settlement.overdueTerm', '(termín byl {date})', { date: currentUserDueDateLabel }) }}</span>
          </template>
          <template v-else-if="currentUserDebt > 0">
            <span class="text-amber-400">{{ t('settlement.dueLabel', 'Termín splatnosti:') }} {{ currentUserDueDateLabel }}</span>
          </template>
          <template v-else>
            <span class="text-emerald-400 font-medium">✓ {{ t('settlement.allSettled', 'Všechny závazky máte řádně uhrazeny') }}</span>
          </template>
        </div>
      </div>

      <!-- Card 2: My Obligations (Manager) vs My Receivables from others (Member) -->
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
        <div class="text-xs font-bold text-slate-400 mb-1">
          {{ isMasterTenant ? t('settlement.card2TitleManager', 'Moje závazky vůči bytu') : t('settlement.card2TitleMember', 'Moje pohledávky vůči ostatním') }}
        </div>
        <div class="text-2xl font-mono font-extrabold text-white">
          {{ (isMasterTenant ? currentUserMemberDebt : currentUserReceivables).toLocaleString('cs-CZ') }} CZK
        </div>
        <div class="text-xs text-emerald-400 mt-2 font-medium">
          <template v-if="isMasterTenant">
            <span v-if="currentUserMemberDebt > 0">{{ t('settlement.managerMemberDebts', 'Dlužné podíly ze společných nákupů zaplacených členy') }}</span><span v-else>✓ {{ t('settlement.managerNoDebts', 'Správce nemá otevřené závazky vůči členům bytu') }}</span>
          </template>
          <template v-else-if="currentUserReceivables > 0">
            {{ t('settlement.receivablesFromPurchases', 'Dluží vám z vámi zaplacených společných nákupů') }}
          </template>
          <template v-else>
            ✓ {{ t('settlement.noReceivables', 'Žádné neuhrazené pohledávky z nákupů') }}
          </template>
        </div>
      </div>

      <!-- Card 3: Payment Discipline -->
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
        <div class="text-xs font-bold text-slate-400 mb-1">
          {{ isMasterTenant ? t('settlement.card3TitleManager', 'Stav platební morálky bytu') : t('settlement.card3TitleMember', 'Stav mé platební morálky') }}
        </div>
        <div 
          class="text-xl font-bold tracking-tight" 
          :class="[
            isMasterTenant ? (overdueDebtorsCount > 0 ? 'text-rose-400' : 'text-emerald-400') :
            (isCurrentUserOverdue ? 'text-rose-400' : (currentUserDebt > 0 ? 'text-amber-400' : 'text-emerald-400'))
          ]"
        >
          <template v-if="isMasterTenant">
            {{ overdueDebtorsCount > 0 ? t('settlement.overdueMembers', '{count} z {total} členů po splatnosti', { count: overdueDebtorsCount, total: Math.max(roommates.length - 1, 0) }) : t('settlement.noOverdueMembers', 'Všichni členové bez prodlení') }}
          </template>
          <template v-else-if="isCurrentUserOverdue">
            {{ t('settlement.overdueStatus', 'V prodlení (Po splatnosti!)') }}
          </template>
          <template v-else-if="currentUserDebt > 0">
            {{ t('settlement.onTimeStatus', 'V termínu (Před splatností)') }}
          </template>
          <template v-else>
            {{ t('settlement.fullySettled', 'Kompletně vyrovnáno') }}
          </template>
        </div>
        <div class="text-xs text-slate-400 mt-2">
          <template v-if="isMasterTenant">
            {{ t('settlement.rentDueLabel', 'Termín splatnosti nájmu:') }} <strong>{{ rentDueDateLabel }}</strong>
          </template>
          <template v-else-if="isCurrentUserOverdue">
            {{ t('settlement.payImmediately', 'Prosíme o bezodkladnou úhradu na účet správce') }}
          </template>
          <template v-else-if="currentUserDebt > 0">
            {{ t('settlement.managerPaymentDue', 'Termín úhrady správci:') }} <strong>{{ currentUserDueDateLabel }}</strong>
          </template>
          <template v-else>
            {{ t('settlement.novemberSettled', 'Platba za listopad byla v pořádku zaúčtována') }}
          </template>
        </div>
      </div>

    </div>

    <section v-if="memberPaymentExpenses.length > 0" class="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
      <h2 class="text-sm font-bold text-slate-100">{{ t('settlement.memberPurchases', 'Úhrady nákupů zaplacených členy') }}</h2>
      <p class="text-xs text-slate-400">{{ t('settlement.memberPurchasesHint', 'Tyto podíly se hradí přímo plátci nákupu, odděleně od účtu správce. Přijetí potvrdí plátce nebo správce v detailu výdaje.') }}</p>
      <p class="text-sm text-amber-300">{{ t('settlement.myMemberDebts', 'Moje závazky vůči členům: {amount} Kč', { amount: currentUserMemberDebt.toLocaleString('cs-CZ') }) }}</p>
      <button v-for="expense in memberPaymentExpenses" :key="expense.id" type="button" @click="openModal('EXP_DETAIL', expense)" class="w-full flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border border-slate-700 bg-slate-800 text-left text-xs focus:ring-2 focus:ring-emerald-500/40 print:!block print:break-inside-avoid">
        <span>{{ expense.title }} · {{ t('settlement.purchasePayer', 'Plátce: {name}', { name: expense.payerName }) }}</span>
        <span class="text-emerald-300 print:hidden">{{ t('settlement.openPurchase', 'Zobrazit podíly a potvrdit úhradu →') }}</span>
      </button>
    </section>

    <!-- Settlement Cards for Each Roommate -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold text-slate-200">
          {{ isMasterTenant ? t('settlement.ordersTitleManager', 'Přehled platebních předpisů členů domácnosti:') : t('settlement.ordersTitleMember', 'Platební předpisy v domácnosti:') }}
        </h2>
        <span class="text-xs text-slate-400">{{ t('settlement.autoCalc', 'Automatický propočet dle m² a spotřeby') }}</span>
      </div>

      <div class="space-y-3">
        <div
          v-for="s in allDisplaySettlements"
          :key="s.roommateId"
          class="p-5 rounded-2xl bg-slate-900 border transition-all relative overflow-hidden print:break-inside-avoid print:overflow-visible"
          :class="[
            s.roommateId === currentUser.id ? 'border-emerald-500/60 ring-2 ring-emerald-500/20 bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950/20' :
            s.status === 'PO_SPLATNOSTI' ? 'border-rose-500/40 bg-gradient-to-r from-slate-900 to-rose-950/10' :
            s.status === 'VYROVNÁNO' ? 'border-slate-800 opacity-90' :
            'border-slate-800'
          ]"
        >
          <!-- Current user badge banner -->
          <div 
            v-if="s.roommateId === currentUser.id"
            class="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-xs font-extrabold px-3 py-0.5 rounded-bl-xl shadow"
          >
            {{ t('settlement.yourOrder', 'Váš platební předpis (Vy)') }}
          </div>

          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            <!-- Roommate identity & room -->
            <div class="flex items-start gap-3.5">
              <div 
                class="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-extrabold text-white shrink-0 shadow-md"
                :class="getRoommateColor(s.roommateId)"
              >
                {{ s.roommateName.charAt(0) }}
              </div>
              
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-base font-bold text-white">{{ s.roommateName }}</h3>
                  
                  <span 
                    v-if="s.roommateId === managerRoommate.id"
                    class="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  >
                    {{ t('settlement.managerBadge', 'Správce bytu') }}
                  </span>

                  <span 
                    class="px-2 py-0.5 rounded text-xs font-bold"
                    :class="SETTLEMENT_BADGE_CLASSES[s.status]"
                  >
                    {{ s.status === 'PO_SPLATNOSTI' ? t('settlement.overdueDays', 'Po splatnosti ({days} dní)', { days: s.daysOverdue }) : (s.status === 'VYROVNÁNO' ? t('settlement.settledOk', 'Vyrovnáno – v pořádku') : t('settlementStatus.' + s.status, SETTLEMENT_STATUS_LABELS[s.status])) }}
                  </span>
                </div>

                <div class="text-xs text-slate-400 mt-0.5">
                  {{ s.roomName }} • {{ t('settlement.areaLabel', 'Plocha:') }} {{ s.roomAreaM2 }} m² ({{ t('settlement.shareLabel', 'podíl') }} {{ s.areaSharePct }} %)
                </div>

                <!-- Cost Breakdown text -->
                <div v-if="s.totalDebt > 0" class="text-xs text-slate-300 mt-2 flex flex-wrap items-center gap-2 font-mono">
                  <span class="bg-slate-800 px-2 py-0.5 rounded text-xs border border-slate-700">{{ t('settlement.breakdownRent', 'Nájem:') }} {{ formatCzk(s.breakdown.rent) }}</span>
                  <span class="bg-slate-800 px-2 py-0.5 rounded text-xs border border-slate-700">{{ t('settlement.breakdownEnergy', 'Energie:') }} {{ formatCzk(s.breakdown.energy) }}</span>
                  <span v-if="s.breakdown.wifi" class="bg-slate-800 px-2 py-0.5 rounded text-xs border border-slate-700">WiFi: {{ formatCzk(s.breakdown.wifi) }}</span>
                  <span v-if="s.breakdown.drogerie" class="bg-slate-800 px-2 py-0.5 rounded text-xs border border-slate-700">{{ t('settlement.breakdownDrugstore', 'Drogerie:') }} {{ formatCzk(s.breakdown.drogerie) }}</span>
                  <span v-if="s.breakdown.other" class="bg-slate-800 px-2 py-0.5 rounded text-xs border border-slate-700">{{ t('settlement.breakdownOther', 'Ostatní:') }} {{ formatCzk(s.breakdown.other) }}</span>
                </div>
                <div v-else class="text-xs text-emerald-400/90 mt-1">
                  {{ s.roommateId === managerRoommate.id ? t('settlement.managerNote', 'Správce bytu – vede účet pro nájem a zálohy.') : t('settlement.allDebtsCleared', 'Všechny pohledávky za měsíc Listopad 2026 byly kompletně vypořádány převodem na účet.') }}
                </div>

                <!-- Upomínka Timestamp info -->
                <div v-if="s.lastReminderSent" class="text-xs text-amber-400/90 mt-2 flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{{ t('settlement.lastReminder', 'Poslední upomínka odeslána: {date}', { date: formatStoredTime(s.lastReminderSent) }) }}</span>
                </div>
              </div>
            </div>

            <!-- Total Debt & Action Buttons -->
            <div class="flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
              
              <div class="text-left sm:text-right">
                <span class="text-xs text-slate-400 block">{{ t('settlement.totalDebtLabel', 'Dlužná částka celkem:') }}</span>
                <span 
                  class="text-2xl font-mono font-extrabold"
                  :class="s.totalDebt > 0 ? (s.status === 'PO_SPLATNOSTI' ? 'text-rose-400' : 'text-amber-400') : 'text-emerald-400'"
                >
                  {{ s.totalDebt.toLocaleString('cs-CZ') }} CZK
                </span>
              </div>

              <!-- Actions -->
              <div class="flex flex-wrap items-center gap-2">
                
                <!-- Odeslat upomínku button: ONLY for Master Tenant, never to oneself -->
                <button type="button"
                  v-if="isMasterTenant && s.roommateId !== currentUser.id && s.status === 'PO_SPLATNOSTI'"
                  @click="sendReminder(s.roommateId)"
                  class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-md shadow-rose-950/40 transition-all flex items-center gap-1.5"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span>{{ t('settlement.sendReminder', 'Odeslat upomínku') }}</span>
                </button>

                <!-- SPAYD QR Platba (Prominent for current user if owing, or standard) -->
                <button type="button"
                  v-if="s.totalDebt > 0"
                  @click="openModal('QR_MODAL', s)"
                  class="px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5"
                  :class="s.roommateId === currentUser.id ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-transparent shadow-md shadow-emerald-950/40 font-bold' : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'"
                >
                  <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <span>{{ s.roommateId === currentUser.id ? t('settlement.payQr', 'Zaplatit (QR kód)') : t('settlement.paymentQr', 'Platební QR') }}</span>
                </button>

                <!-- Označit jako zaplaceno: ONLY for Master Tenant -->
                <button type="button"
                  v-if="isMasterTenant && s.totalDebt > 0"
                  @click="openModal('CONFIRM_MODAL', s)"
                  class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40"
                >
                  {{ t('settlement.markPaid', 'Označit jako zaplaceno') }}
                </button>

                <!-- When paid: show detail -->
                <span 
                  v-else-if="s.totalDebt === 0" 
                  class="px-3 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20"
                >
                  ✓ {{ t('settlement.paid', 'Uhrazeno') }}
                </span>

              </div>

            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- Debt Matrix Summary -->
    <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-xs font-bold text-slate-400">
          {{ t('settlement.matrixTitle', 'Matice vzájemného vyrovnání všech členů bytu:') }}
        </h3>
        <span class="text-xs text-slate-400">{{ t('settlement.matrixHighlight', 'Zvýrazněn váš řádek') }}</span>
      </div>

      <div class="border border-slate-800 rounded-xl overflow-x-auto bg-slate-850" tabindex="0" role="region" :aria-label="t('settlement.matrixAria', 'Matice vzájemného vyrovnání')">
        <p class="px-3 pt-2 text-xs text-slate-400 md:hidden print:hidden">{{ t('settlement.scrollHint', 'Tabulku lze posouvat vodorovně →') }}</p>
        <table class="w-full min-w-[760px] text-left text-xs">
          <thead class="bg-slate-800/80 text-slate-400 border-b border-slate-700">
            <tr>
              <th class="py-2.5 px-3">{{ t('settlement.thMember', 'Člen bytu') }}</th>
              <th class="py-2.5 px-3">{{ t('settlement.thRent', 'Předpis nájmu') }}</th>
              <th class="py-2.5 px-3">{{ t('settlement.thEnergy', 'Zálohy energie') }}</th>
              <th class="py-2.5 px-3">{{ t('settlement.thOther', 'Ostatní nákupy') }}</th>
              <th class="py-2.5 px-3 text-right">{{ t('settlement.thDue', 'K úhradě správci') }}</th>
              <th class="py-2.5 px-3 text-center">{{ t('settlement.thStatus', 'Status') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            <tr 
              v-for="s in allDisplaySettlements" 
              :key="s.roommateId"
              :class="s.roommateId === currentUser.id ? 'bg-emerald-500/10 font-bold border-l-2 border-emerald-500' : 'hover:bg-slate-800/50 transition-colors'"
            >
              <td class="py-2.5 px-3 text-slate-200">
                <span class="font-semibold">{{ s.roommateName }}</span>
                <span v-if="s.roommateId === currentUser.id" class="text-emerald-400 ml-1.5 text-xs">{{ t('settlement.youTag', '[Vy]') }}</span>
                <span v-else-if="s.roommateId === managerRoommate.id" class="text-slate-400 ml-1.5 text-xs">{{ t('settlement.managerTag', '[Správce]') }}</span>
              </td>
              <td class="py-2.5 px-3 font-mono text-slate-300">{{ s.breakdown.rent.toLocaleString('cs-CZ') }} CZK</td>
              <td class="py-2.5 px-3 font-mono text-slate-300">{{ s.breakdown.energy.toLocaleString('cs-CZ') }} CZK</td>
              <td class="py-2.5 px-3 font-mono text-slate-300">{{ ((s.breakdown.drogerie || 0) + (s.breakdown.wifi || 0) + (s.breakdown.other || 0)).toLocaleString('cs-CZ') }} CZK</td>
              <td class="py-2.5 px-3 font-mono font-bold text-right" :class="s.totalDebt > 0 ? (s.status === 'PO_SPLATNOSTI' ? 'text-rose-400' : 'text-amber-400') : 'text-emerald-400'">
                {{ s.totalDebt.toLocaleString('cs-CZ') }} CZK
              </td>
              <td class="py-2.5 px-3 text-center">
                <span 
                  class="px-2 py-0.5 rounded text-xs font-bold"
                  :class="SETTLEMENT_BADGE_CLASSES[s.status]"
                >
                  {{ t('settlementStatus.' + s.status, SETTLEMENT_STATUS_LABELS[s.status]) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { formatStoredTime } from '../utils/localeDisplay'
import { SETTLEMENT_BADGE_CLASSES } from '../utils/labels'
import { formatDateCz, formatCzk } from '../utils/format'
import { DEMO_TODAY } from '../data/mockData'
import { computed } from 'vue'
import { useSpolubyt } from '../composables/useSpolubyt'
import { DebtSettlement } from '../types'
import { SETTLEMENT_STATUS_LABELS } from '../utils/labels'
import { t } from '../i18n'

const { 
  currentUser,
  managerRoommate,
  managerSettlement,
  isMasterTenant,
  currentUserSettlement,
  currentUserDebt,
  isCurrentUserOverdue,
  currentUserReceivables,
  currentUserMemberDebt,
  expenses,
  settlements, 
  settings, 
  roommates,
  totalReceivables, 
  debtorsCount, 
  overdueDebtorsCount, 
  openModal, 
  sendReminder, 
} = useSpolubyt()

const settlementDebtorsSummary = computed(() => {
  const dCount = debtorsCount.value
  const odCount = overdueDebtorsCount.value
  let dText = t('settlement.openOrdersMany', '{count} otevřených platebních předpisů', { count: dCount })
  if (dCount === 1) dText = t('settlement.openOrderOne', '1 otevřený platební předpis')
  else if (dCount >= 2 && dCount <= 4) dText = t('settlement.openOrderFew', '{count} otevřené platební předpisy', { count: dCount })
  else if (dCount === 0) dText = t('settlement.openOrderZero', '0 otevřených platebních předpisů')
  return t('settlement.debtorsSummary', 'Celkem {text} ({overdue} po splatnosti)', { text: dText, overdue: odCount })
})

// All settlements including the manager for complete overview
const allDisplaySettlements = computed<DebtSettlement[]>(() => {
  const list = [...settlements.value]
  // Add manager record
  const managerRecord = managerSettlement.value

  // Put current user first, then manager, then others
  const results = [managerRecord, ...list]
  return results.sort((a, b) => {
    if (a.roommateId === currentUser.value.id) return -1
    if (b.roommateId === currentUser.value.id) return 1
    return 0
  })
})

const getRoommateColor = (roommateId: string) => {
  if (roommateId === 'user-jakub') return 'bg-blue-600'
  if (roommateId === 'user-eliska') return 'bg-purple-600'
  if (roommateId === 'user-martin') return 'bg-amber-600'
  return 'bg-emerald-600'
}

const showExportToast = (): void => {
  window.print()
}

const memberPaymentExpenses = computed(() => expenses.value.filter(expense => expense.payerId !== managerRoommate.value.id
  && expense.shares.some(share => share.status === 'DLUŽÍ' || share.status === 'PO_SPLATNOSTI')
  && (isMasterTenant.value || expense.payerId === currentUser.value.id || expense.shares.some(share => share.roommateId === currentUser.value.id && (share.status === 'DLUŽÍ' || share.status === 'PO_SPLATNOSTI')))))

const formatDate = (dateStr: string): string => formatDateCz(dateStr, 'none')

const currentUserDueDateLabel = computed(() => {
  return currentUserSettlement.value?.dueDate
    ? formatDate(currentUserSettlement.value.dueDate)
    : '—'
})

const currentUserDaysOverdue = computed(() => {
  return currentUserSettlement.value?.daysOverdue || 0
})

const currentUserOverdueText = computed(() => {
  const days = currentUserDaysOverdue.value
  if (days === 1) return t('settlement.overdueDayOne', '1 den po splatnosti')
  if (days >= 2 && days <= 4) return t('settlement.overdueDayFew', '{days} dny po splatnosti', { days })
  return t('settlement.overdueDayMany', '{days} dní po splatnosti', { days })
})

const rentDueDate = computed(() => {
  const now = new Date(DEMO_TODAY + 'T12:00:00')
  return new Date(now.getFullYear(), now.getMonth(), settings.value.dueDayOfMonth)
})

const rentDueDateLabel = computed(() => {
  const d = rentDueDate.value
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`
})
</script>
