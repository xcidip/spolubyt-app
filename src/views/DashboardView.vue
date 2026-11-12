<template>
  <div class="space-y-6">
    
    <!-- Top Hero / Welcome Banner -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
      <div>
        <div class="flex items-center gap-2 text-xs font-semibold mb-1" :class="isMasterTenant ? 'text-emerald-400' : 'text-sky-400'">
          <span class="w-2 h-2 rounded-full animate-pulse" :class="isMasterTenant ? 'bg-emerald-500' : 'bg-sky-500'"></span>
          <span>{{ isMasterTenant ? t('dashboard.heroBadgeManager', 'Centrální přehled správce bytu') : t('dashboard.heroBadgeMember', 'Osobní přehled spolubydlícího ({role})', { role: t('roles.' + currentUser.role, currentUser.role) }) }}</span>
        </div>
        <h1 class="text-2xl font-extrabold text-white tracking-tight">
          {{ t('dashboard.welcomeBack', 'Vítej zpět, {name}', { name: currentUser.name }) }}
        </h1>
        <p class="text-xs text-slate-400 mt-1">
          {{ t('dashboard.managedFlat', 'Spravovaný byt:') }} <strong class="text-slate-200">{{ settings.name }}</strong> • 
          {{ t('dashboard.roomLabel', 'Pokoj:') }} <strong class="text-slate-200">{{ currentUser.roomName }}</strong> ({{ currentUser.roomAreaM2 }} m², {{ t('dashboard.shareLabel', 'podíl') }} {{ currentUser.areaSharePct }} %)
        </p>
      </div>

      <!-- Contextual Info & Quick Actions -->
      <div class="flex flex-col sm:flex-row sm:items-center gap-3">
        <!-- Weekly Cleaning Status Card (Clickable to Cleaning) -->
        <div
          @click="navigateTo('CLEANING')"
          tabindex="0"
          role="button"
          @keydown.enter="navigateTo('CLEANING')"
          @keydown.space.prevent="navigateTo('CLEANING')"
          class="cursor-pointer group flex items-center gap-3 px-3.5 py-2 rounded-xl border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          :class="myCurrentCleaningShift?.isCompleted 
            ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20' 
            : 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20'"
          :title="t('dashboard.goToCleaningRota', 'Přejít na rozpis úklidu')"
        >
          <div class="text-lg">
            {{ myCurrentCleaningShift?.taskKey === 'KITCHEN' ? '🍳' : myCurrentCleaningShift?.taskKey === 'BATHROOM' ? '🚿' : myCurrentCleaningShift?.taskKey === 'CORRIDOR' ? '🧹' : (myCurrentCleaningShift?.taskKey === 'TRASH' ? '♻️' : '✨') }}
          </div>
          <div>
            <div class="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <span>{{ t('dashboard.cleaningThisWeekLabel', 'Úklid tento týden:') }}</span>
              <span 
                class="font-bold text-xs px-1.5 py-0.5 rounded whitespace-nowrap shrink-0"
                :class="myCurrentCleaningShift?.isCompleted ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'"
              >
                {{ myCurrentCleaningShift?.isCompleted ? t('dashboard.shiftDoneBadge', 'Splněno ✓') : t('dashboard.shiftWaiting', 'Čeká na vás') }}
              </span>
            </div>
            <div class="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
              {{ myCurrentCleaningShift ? myCurrentCleaningShift.taskTitle : t('dashboard.noShiftAssigned', 'Nemáte přiřazen úklid') }}
            </div>
          </div>
        </div>

        <!-- Quick Action: Zapsat odečet měřidla -->
        <button type="button"
          @click="openModal('METER_ADD')"
          class="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shrink-0"
        >
          <svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>{{ t('dashboard.logReading', 'Zapsat odečet') }}</span>
        </button>
      </div>
    </div>

    <!-- 3 Hero KPI Cards (Role & User-Perspective aware) -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      
      <!-- Card 1: Monthly Expenses -->
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between gap-2 flex-wrap text-xs text-slate-400 mb-2">
            <span class="font-semibold text-xs text-slate-400 min-w-0">
              {{ isMasterTenant ? t('dashboard.monthlyFlatCosts', 'Měsíční náklady bytu (listopad)') : t('dashboard.myMonthlyShare', 'Můj měsíční podíl nákladů (listopad)') }}
            </span>
            <span class="text-emerald-400 font-semibold text-xs bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 shrink-0 whitespace-nowrap leading-tight">
              {{ isMasterTenant ? t('dashboard.monthlyDelta', '+2,4 % m/m') : t('dashboard.shareOfTotal', 'Podíl {pct} %', { pct: currentUser.areaSharePct }) }}
            </span>
          </div>
          <div class="text-2xl font-extrabold text-white tracking-tight">
            {{ (isMasterTenant ? monthlyTotalExpenses : currentUserMonthlyExpenses).toLocaleString('cs-CZ') }} CZK
          </div>
        </div>
        <div class="text-xs text-slate-400 mt-2 flex items-center justify-between gap-2 flex-wrap">
          <span v-if="isMasterTenant">{{ t('dashboard.previousMonth', 'Předchozí měsíc:') }} {{ previousMonthTotalExpenses.toLocaleString('cs-CZ') }} CZK</span>
          <span v-else>{{ t('dashboard.totalFlatCosts', 'Celkem náklady bytu:') }} {{ monthlyTotalExpenses.toLocaleString('cs-CZ') }} CZK</span>
          <button type="button" @click="navigateTo('EXPENSES')" class="text-emerald-400 hover:underline font-medium text-xs shrink-0">
            {{ t('dashboard.statement', 'Výpis →') }}
          </button>
        </div>
      </div>

      <!-- Card 2: Receivables / Personal Debt -->
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between gap-2 flex-wrap text-xs text-slate-400 mb-2">
            <span class="font-semibold text-xs text-slate-400 min-w-0">
              {{ isMasterTenant ? t('dashboard.receivablesTitle', 'Pohledávky správce (dluží bytu)') : t('dashboard.myDebtTitle', 'Můj aktuální nedoplatek (k úhradě)') }}
            </span>
            
            <!-- Badge -->
            <span 
              v-if="isMasterTenant"
              class="text-xs font-semibold px-2.5 py-0.5 rounded-full border shrink-0 whitespace-nowrap leading-tight"
              :class="debtorsBadgeClass"
            >
              {{ debtorsBadgeText }}
            </span>
            <span 
              v-else
              class="text-xs font-semibold px-2.5 py-0.5 rounded-full border shrink-0 whitespace-nowrap leading-tight"
              :class="[
                isCurrentUserOverdue ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse' :
                currentUserDebt > 0 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              ]"
            >
              {{ isCurrentUserOverdue ? currentUserOverdueText : (currentUserDebt > 0 ? t('dashboard.beforeDue', 'Před splatností') : t('dashboard.settled', 'Vyrovnáno')) }}
            </span>
          </div>

          <div 
            class="text-2xl font-extrabold tracking-tight"
            :class="[
              isMasterTenant ? 'text-emerald-400' :
              (isCurrentUserOverdue ? 'text-rose-400' : (currentUserDebt > 0 ? 'text-amber-400' : 'text-emerald-400'))
            ]"
          >
            {{ (isMasterTenant ? totalReceivables : currentUserDebt).toLocaleString('cs-CZ') }} CZK
          </div>
        </div>

        <div class="text-xs text-slate-400 mt-2 flex items-center justify-between gap-2 flex-wrap">
          <span v-if="isMasterTenant" class="min-w-0" :class="overdueDebtorsCount > 0 ? 'text-rose-400 font-semibold' : 'text-slate-400'">
            {{ overdueDebtorsSubtitle }}
          </span>
          <span v-else class="min-w-0" :class="isCurrentUserOverdue ? 'text-rose-400 font-semibold' : (currentUserDebt > 0 ? 'text-amber-300' : 'text-emerald-400 font-medium')">
            {{ isCurrentUserOverdue ? t('dashboard.overdueSince', '⚠️ Splatnost vypršela {date}!', { date: currentUserDueDateLabel }) : (currentUserDebt > 0 ? t('dashboard.dueOn', 'Termín splatnosti: {date}', { date: currentUserDueDateLabel }) : t('dashboard.allSettledCheck', '✓ Všechny platby máte vyrovnány')) }}
          </span>

          <button type="button"
            v-if="!isMasterTenant && currentUserDebt > 0"
            @click="currentUserSettlement && openModal('QR_MODAL', currentUserSettlement)"
            class="text-emerald-400 hover:underline font-bold text-xs flex items-center gap-1 shrink-0"
          >
            {{ t('dashboard.payQr', 'Zaplatit QR →') }}
          </button>
          <button type="button"
            v-else
            @click="navigateTo('SETTLEMENT')" 
            class="text-emerald-400 hover:underline font-medium text-xs shrink-0"
          >
            {{ t('dashboard.settlement', 'Vyrovnání →') }}
          </button>
        </div>
      </div>

      <!-- Card 3: Due date to Landlord or to Manager -->
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between gap-2 flex-wrap text-xs text-slate-400 mb-2">
            <span class="font-semibold text-xs text-slate-400 min-w-0">
              {{ isMasterTenant ? t('dashboard.rentDueTitle', 'Nájem majiteli (splatnost)') : t('dashboard.myPaymentDueTitle', 'Termín mé úhrady správci') }}
            </span>
            <span 
              class="text-xs font-semibold px-2.5 py-0.5 rounded-full border shrink-0 whitespace-nowrap leading-tight"
              :class="[
                isMasterTenant ? 'text-amber-300 bg-amber-500/10 border-amber-500/25' :
                (isCurrentUserOverdue ? 'text-rose-300 bg-rose-500/15 border-rose-500/30' : 
                 (currentUserDebt > 0 ? 'text-amber-300 bg-amber-500/15 border-amber-500/30' : 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'))
              ]"
            >
              {{ isMasterTenant ? t('dashboard.duePrefix', 'Termín: {date}', { date: rentDueDateShortLabel }) : (isCurrentUserOverdue ? t('dashboard.wasDuePrefix', 'Byl: {date}', { date: currentUserDueDateShortLabel }) : (currentUserDebt > 0 ? t('dashboard.duePrefix', 'Termín: {date}', { date: currentUserDueDateShortLabel }) : t('dashboard.paid', 'Uhrazeno'))) }}
            </span>
          </div>

          <div 
            class="text-2xl font-extrabold tracking-tight flex items-baseline gap-2 flex-wrap"
            :class="[
              isMasterTenant ? 'text-amber-300' :
              (isCurrentUserOverdue ? 'text-rose-400' : (currentUserDebt > 0 ? 'text-amber-300' : 'text-emerald-300'))
            ]"
          >
            <template v-if="isMasterTenant">
              <span>{{ t('dashboard.dueLabel', 'Splatnost {date}', { date: rentDueDateLabel }) }}</span>
              <span class="text-xs font-normal text-slate-400">({{ settings.monthlyRent.toLocaleString('cs-CZ') }} CZK)</span>
            </template>
            <template v-else-if="isCurrentUserOverdue">
              <span>{{ currentUserOverdueText }}</span>
              <span class="text-xs font-normal text-slate-400">({{ currentUserDebt.toLocaleString('cs-CZ') }} CZK)</span>
            </template>
            <template v-else-if="currentUserDebt > 0">
              <span>{{ t('dashboard.duePrefix', 'Termín: {date}', { date: currentUserDueDateLabel }) }}</span>
              <span class="text-xs font-normal text-slate-400">({{ currentUserDebt.toLocaleString('cs-CZ') }} CZK)</span>
            </template>
            <template v-else>
              <span>{{ t('dashboard.allGood', 'V pořádku') }}</span>
              <span class="text-xs font-normal text-slate-400">({{ t('dashboard.zeroDebt', '0 CZK nedoplatek') }})</span>
            </template>
          </div>
        </div>

        <div class="text-xs text-slate-400 mt-2 flex items-center justify-between gap-2 flex-wrap">
          <span v-if="isMasterTenant" class="text-amber-400/90 font-medium min-w-0">{{ t('dashboard.awaitingShares', 'Čeká na doplacení podílů') }}</span>
          <span v-else-if="currentUserDebt > 0" class="min-w-0" :class="isCurrentUserOverdue ? 'text-rose-400 font-medium' : 'text-amber-400/90 font-medium'">
            {{ t('dashboard.payee', 'Příjemce:') }} {{ managerRoommate.name }}
          </span>
          <span v-else class="text-emerald-400 font-medium min-w-0">
            {{ t('dashboard.novemberPosted', 'Platba za listopad zaúčtována') }}
          </span>

          <span class="text-xs text-slate-400 font-medium shrink-0">
            {{ t('dashboard.account', 'Účet:') }} {{ settings.accountNumber.split(' ')[0] }}
          </span>
        </div>
      </div>

    </div>

    <!-- Content Grid: Asymmetric 2:1 Split -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- Left Column (8 cols): Roommates balance & Recent Expenses -->
      <div class="lg:col-span-8 space-y-6">
        
        <!-- Roommates Balance Widget -->
        <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-bold text-slate-100 tracking-tight">
                {{ isMasterTenant ? t('dashboard.balanceTitleManager', 'Aktuální bilance spolubydlících (pohledávky správce)') : t('dashboard.balanceTitleMember', 'Bilance plateb v bytě (můj stav & spolubydlící)') }}
              </h2>
              <p class="text-xs text-slate-400">
                {{ isMasterTenant ? t('dashboard.balanceSubtitleManager', 'Přehled dlužných pohledávek za nájem, energie a společné nákupy') : t('dashboard.balanceSubtitleMember', 'Stav vyrovnání za měsíc listopad 2026') }}
              </p>
            </div>
            <button type="button"
              @click="navigateTo('SETTLEMENT')"
              class="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>{{ t('dashboard.fullMatrix', 'Celá matice') }}</span>
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <!-- Highlight card for non-manager member -->
          <div 
            v-if="!isMasterTenant"
            class="p-4 rounded-xl bg-gradient-to-r from-slate-850 to-emerald-950/20 border-2 border-emerald-500/40 shadow-sm space-y-3"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div 
                  class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 shadow" 
                  :class="currentUser.avatarColor"
                >
                  {{ currentUser.avatarInitial }}
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-white">{{ currentUser.name }}</span>
                    <span class="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {{ t('dashboard.youBadge', 'Vy (přihlášený profil)') }}
                    </span>
                  </div>
                  <div class="text-xs text-slate-400">{{ currentUser.roomName }} • {{ currentUser.roomAreaM2 }} m² ({{ currentUser.areaSharePct }} %)</div>
                </div>
              </div>
              
              <div class="text-right">
                <div class="text-xs text-slate-400">{{ t('dashboard.yourDebt', 'Váš nedoplatek:') }}</div>
                <div 
                  class="text-lg font-mono font-extrabold" 
                  :class="isCurrentUserOverdue ? 'text-rose-400' : (currentUserDebt > 0 ? 'text-amber-400' : 'text-emerald-400')"
                >
                  {{ currentUserDebt.toLocaleString('cs-CZ') }} CZK
                </div>
              </div>
            </div>

            <!-- Breakdown of user's debt if any -->
            <div v-if="currentUserSettlement && currentUserSettlement.totalDebt > 0" class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
              <div class="flex flex-wrap gap-2 text-xs font-mono text-slate-300">
                <span class="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{{ t('dashboard.breakdownRent', 'Nájem:') }} {{ formatCzk(currentUserSettlement.breakdown.rent) }}</span>
                <span class="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{{ t('dashboard.breakdownEnergy', 'Energie:') }} {{ formatCzk(currentUserSettlement.breakdown.energy) }}</span>
                <span v-if="currentUserSettlement.breakdown.wifi" class="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">WiFi: {{ formatCzk(currentUserSettlement.breakdown.wifi) }}</span>
                <span v-if="currentUserSettlement.breakdown.drogerie" class="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{{ t('dashboard.breakdownDrogerie', 'Drogerie:') }} {{ formatCzk(currentUserSettlement.breakdown.drogerie) }}</span>
                <span v-if="currentUserSettlement.breakdown.other" class="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{{ t('dashboard.breakdownOther', 'Ostatní:') }} {{ formatCzk(currentUserSettlement.breakdown.other) }}</span>
              </div>

              <button type="button"
                @click="currentUserSettlement && openModal('QR_MODAL', currentUserSettlement)"
                class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 transition-all hover:scale-105"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <span>{{ t('dashboard.payByQr', 'Zaplatit QR kódem') }}</span>
              </button>
            </div>
            <div v-else class="text-xs text-emerald-400/90 pt-1 border-t border-slate-800 flex items-center gap-1.5">
              <span>✓ {{ t('dashboard.novemberSettled', 'Všechny platby za listopad máte řádně vyrovnány. Děkujeme za včasnou úhradu!') }}</span>
            </div>
          </div>

          <!-- Section label if member -->
          <div v-if="!isMasterTenant" class="text-xs font-semibold text-slate-400 pt-1">
            {{ t('dashboard.otherRoommates', 'Ostatní spolubydlící v bytě:') }}
          </div>

          <!-- Settlements list -->
          <div class="space-y-2.5">
            <div
              v-for="s in otherSettlements"
              :key="s.roommateId"
              class="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-850 border border-slate-800 hover:border-slate-700 transition-colors gap-3"
            >
              <!-- Roommate info -->
              <div class="flex items-center gap-3">
                <div 
                  class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm"
                  :class="getRoommateColor(s.roommateId)"
                >
                  {{ s.roommateName.charAt(0) }}
                </div>
                <div>
                  <div class="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <span>{{ s.roommateName }}</span>
                    <span v-if="s.roommateId === managerRoommate.id" class="text-xs text-emerald-400 font-normal">{{ t('dashboard.managerTag', '[Správce bytu]') }}</span>
                  </div>
                  <div class="text-xs text-slate-400">{{ s.roomName }}</div>
                </div>
              </div>

              <!-- Debt and status -->
              <div class="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                <div class="text-right">
                  <div class="text-sm font-mono font-bold" :class="s.totalDebt > 0 ? 'text-amber-400' : 'text-emerald-400'">
                    {{ s.totalDebt.toLocaleString('cs-CZ') }} CZK
                  </div>
                  <div class="text-xs">
                    <span 
                      class="px-2 py-0.5 rounded font-semibold text-xs"
                      :class="SETTLEMENT_BADGE_CLASSES[s.status]"
                    >
                      {{ s.status === 'PO_SPLATNOSTI' ? t('dashboard.overdueDays', 'Po splatnosti ({days} dní)', { days: s.daysOverdue }) : t('settlementStatus.' + s.status, SETTLEMENT_STATUS_LABELS[s.status]) }}
                    </span>
                  </div>
                </div>

                <!-- Actions: Full actions for Manager, read-only/QR for members -->
                <div class="flex items-center gap-1.5 shrink-0">
                  <button type="button"
                    v-if="s.totalDebt > 0"
                    @click="openModal('QR_MODAL', s)"
                    class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1"
                    :title="t('dashboard.showSpaydQr', 'Zobrazit SPAYD QR kód pro mobilní platbu')"
                  >
                    <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    <span>QR</span>
                  </button>

                  <!-- Upomínka only for Master Tenant -->
                  <button type="button"
                    v-if="isMasterTenant && s.status === 'PO_SPLATNOSTI'"
                    @click="sendReminder(s.roommateId)"
                    class="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors"
                    :title="t('dashboard.sendReminderTitle', 'Odeslat diskrétní upomínku dlužníkovi')"
                  >
                    {{ t('dashboard.remind', 'Upomínka') }}
                  </button>

                  <!-- Zaplaceno only for Master Tenant -->
                  <button type="button"
                    v-if="isMasterTenant && s.totalDebt > 0"
                    @click="openModal('CONFIRM_MODAL', s)"
                    class="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-sm"
                    :title="t('dashboard.markPaidTitle', 'Označit platbu jako zaplacenou')"
                  >
                    {{ t('dashboard.markPaid', 'Zaplaceno') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Expenses Widget -->
        <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-bold text-slate-100 tracking-tight">
                {{ t('dashboard.recentExpenses', 'Poslední výdaje a nákupy') }}
              </h2>
              <p class="text-xs text-slate-400">{{ t('dashboard.recentExpensesSubtitle', 'Chronologický přehled nedávných transakcí') }}</p>
            </div>
            <button type="button"
              @click="navigateTo('EXPENSES')"
              class="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>{{ t('dashboard.allExpenses', 'Všechny výdaje') }}</span>
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div class="border border-slate-800 rounded-xl overflow-x-auto bg-slate-850" tabindex="0" role="region" :aria-label="t('dashboard.recentExpenses', 'Poslední výdaje a nákupy')">
            <p class="px-3 pt-2 text-xs text-slate-400 md:hidden">{{ t('dashboard.scrollHint', 'Tabulku lze posouvat vodorovně →') }}</p>
            <table class="w-full min-w-[720px] text-left text-xs">
              <thead class="bg-slate-800/80 text-slate-400 border-b border-slate-700">
                <tr>
                  <th class="py-2.5 px-3">{{ t('dashboard.thDate', 'Datum') }}</th>
                  <th class="py-2.5 px-3">{{ t('dashboard.thTitle', 'Název výdaje') }}</th>
                  <th class="py-2.5 px-3">{{ t('dashboard.thPayer', 'Plátce') }}</th>
                  <th class="py-2.5 px-3 text-right">{{ t('dashboard.thAmount', 'Částka') }}</th>
                  <th class="py-2.5 px-3 text-center">{{ t('dashboard.thStatus', 'Stav') }}</th>
                  <th class="py-2.5 px-3 text-right">{{ t('dashboard.thAction', 'Akce') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800">
                <tr 
                  v-for="exp in recentExpenses" 
                  :key="exp.id" 
                  class="hover:bg-slate-800/60 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                >
                  <td class="py-2.5 px-3 font-mono text-slate-400">{{ formatDate(exp.date) }}</td>
                  <td class="py-2.5 px-3 font-medium text-slate-200">
                    <button type="button" @click="openModal('EXP_DETAIL', exp)" class="text-left hover:text-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 rounded">{{ exp.title }}</button>
                  </td>
                  <td class="py-2.5 px-3 text-slate-400">{{ exp.payerName }}</td>
                  <td class="py-2.5 px-3 font-mono font-bold text-slate-100 text-right">
                    {{ exp.totalAmount.toLocaleString('cs-CZ') }} CZK
                  </td>
                  <td class="py-2.5 px-3 text-center">
                    <span 
                      class="px-2 py-0.5 rounded text-xs font-bold"
                      :class="EXPENSE_BADGE_CLASSES[exp.status]"
                    >
                      {{ t('expenseStatus.' + exp.status, EXPENSE_STATUS_LABELS[exp.status]) }}
                    </span>
                  </td>
                  <td class="py-2.5 px-3 text-right">
                    <span class="text-emerald-400 font-semibold hover:underline">{{ t('dashboard.detail', 'Detail →') }}</span>
                  </td>
                </tr>
                <tr v-if="recentExpenses.length === 0">
                  <td colspan="6" class="py-10 text-center text-slate-400">
                    <div class="space-y-2">
                      <p class="font-medium text-slate-300">{{ t('dashboard.noExpensesYet', 'Zatím zde nejsou žádné výdaje.') }}</p>
                      <button type="button" @click="navigateTo('EXPENSES')" class="text-xs text-emerald-400 underline font-semibold">{{ t('dashboard.showAllExpenses', 'Zobrazit všechny výdaje') }}</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- Right Column (4 cols): Energy status, Cart teaser, Announcements -->
      <div class="lg:col-span-4 space-y-6">
        
        <!-- Energy Quick Widget -->
        <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
              <svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{{ t('dashboard.energyAndMeters', 'Energie a měřidla') }}</span>
            </h2>
            <button type="button"
              @click="navigateTo('ENERGY')"
              class="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              {{ t('dashboard.detail', 'Detail →') }}
            </button>
          </div>

          <!-- Teploměr záloh (annualEnergyPrediction) -->
          <div class="space-y-1.5 p-3 rounded-xl bg-slate-850 border border-slate-800">
            <div class="flex justify-between items-center text-xs">
              <span class="text-slate-400">{{ t('dashboard.annualAdvanceDrawdown', 'Čerpání ročních záloh:') }}</span>
              <span 
                class="font-bold font-mono"
                :class="annualEnergyPrediction.drawdownPct > 100 ? 'text-amber-400' : 'text-emerald-400'"
              >
                {{ annualEnergyPrediction.drawdownPct }} % ({{ t('risk.' + annualEnergyPrediction.riskLevel, annualEnergyPrediction.riskLevel) }})
              </span>
            </div>
            <!-- Progress bar -->
            <div class="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
              <div 
                class="h-full rounded-full transition-all duration-300"
                :class="annualEnergyPrediction.drawdownPct > 100 ? 'bg-gradient-to-r from-amber-500 to-rose-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'"
                :style="{ width: `${Math.min(annualEnergyPrediction.drawdownPct, 100)}%` }"
              ></div>
            </div>
            <div class="text-xs text-slate-400 flex justify-between gap-1">
              <span>0 %</span>
              <span>{{ annualEnergyPrediction.isSurplus ? t('dashboard.estimateSurplus', 'Odhad přeplatku:') : t('dashboard.estimateDeficit', 'Odhad nedoplatku:') }} <strong :class="annualEnergyPrediction.isSurplus ? 'text-emerald-400' : 'text-rose-400'">{{ annualEnergyPrediction.formattedDelta }}</strong></span>
              <span>100 % ({{ t('dashboard.advanceCap', 'Zálohová hranice') }})</span>
            </div>
          </div>

          <!-- Latest readings summary -->
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="p-2.5 rounded-lg bg-slate-850 border border-slate-800">
              <div class="text-xs text-slate-400">{{ t('dashboard.electricityKwh', 'Elektřina (kWh)') }}</div>
              <div class="font-mono font-bold text-slate-200 mt-0.5">
                {{ latestMeters['ELEKTŘINA']?.value.toLocaleString('cs-CZ') || '—' }} kWh
              </div>
              <div class="text-xs text-emerald-400">
                {{ latestMeters['ELEKTŘINA'] ? `+${latestMeters['ELEKTŘINA'].delta} kWh` : t('dashboard.noReading', 'Bez odečtu') }}
              </div>
            </div>
            <div class="p-2.5 rounded-lg bg-slate-850 border border-slate-800">
              <div class="text-xs text-slate-400">{{ t('dashboard.gasM3', 'Plyn (m³)') }}</div>
              <div class="font-mono font-bold text-slate-200 mt-0.5">
                {{ latestMeters['PLYN']?.value.toLocaleString('cs-CZ') || '—' }} m³
              </div>
              <div class="text-xs text-emerald-400">
                {{ latestMeters['PLYN'] ? `+${latestMeters['PLYN'].delta} m³` : t('dashboard.noReading', 'Bez odečtu') }}
              </div>
            </div>
          </div>

          <button type="button"
            @click="openModal('METER_ADD')"
            class="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>{{ t('dashboard.enterMeterReading', 'Zadat stav měřidla') }}</span>
          </button>
        </div>

        <!-- Weekly Cleaning Shift Widget -->
        <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
              <svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span>{{ t('dashboard.cleaningThisWeek', 'Úklid tento týden') }}</span>
            </h2>
            <button type="button"
              @click="navigateTo('CLEANING')"
              class="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              {{ t('dashboard.cleaningRota', 'Rozpis →') }}
            </button>
          </div>

          <!-- My Shift Card -->
          <div 
            v-if="myCurrentCleaningShift"
            class="p-3.5 rounded-xl border space-y-2.5 transition-colors"
            :class="myCurrentCleaningShift.isCompleted ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <span class="text-xs font-bold" :class="myCurrentCleaningShift.isCompleted ? 'text-emerald-400' : 'text-amber-400'">
                  {{ myCurrentCleaningShift.isCompleted ? t('dashboard.myShiftDone', '✓ Tvoje směna je splněna') : t('dashboard.myShiftThisWeek', '⏳ Tvoje směna tento týden') }}
                </span>
                <h3 class="text-xs font-bold text-white mt-0.5">
                  {{ t('cleaning.task.' + myCurrentCleaningShift.taskKey.toLowerCase(), myCurrentCleaningShift.taskTitle) }}
                </h3>
              </div>
              <span 
                class="text-xs px-2 py-0.5 rounded-full font-bold whitespace-nowrap"
                :class="myCurrentCleaningShift.isCompleted ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'"
              >
                {{ myCurrentCleaningShift.isCompleted ? t('dashboard.shiftDoneBadgeShort', 'Splněno') : t('dashboard.bySunday', 'Do neděle') }}
              </span>
            </div>

            <!-- Confirm button directly on dashboard -->
            <button type="button"
              v-if="!myCurrentCleaningShift.isCompleted"
              @click="toggleShiftStatus(myCurrentCleaningShift.id)"
              class="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>{{ t('dashboard.markMyCleaningDone', 'Označit můj úklid jako hotový') }}</span>
            </button>
          </div>

          <!-- All 4 zones compact status -->
          <div class="space-y-1.5 pt-1">
            <div 
              v-for="shift in currentWeekCleaningShifts" 
              :key="shift.id"
              class="flex items-center justify-between p-2 rounded-lg bg-slate-850 border border-slate-800 text-xs"
            >
              <div class="flex items-center gap-2 truncate min-w-0">
                <span class="text-xs">
                  {{ shift.taskKey === 'KITCHEN' ? '🍳' : shift.taskKey === 'BATHROOM' ? '🚿' : shift.taskKey === 'CORRIDOR' ? '🧹' : '♻️' }}
                </span>
                <span class="text-slate-300 truncate">{{ shift.taskTitle.split(' ')[0] }} ({{ shift.roommateName.split(' ')[0] }})</span>
              </div>
              <span 
                class="text-xs font-bold px-1.5 py-0.5 rounded shrink-0 font-mono"
                :class="shift.isCompleted ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 bg-slate-800'"
              >
                {{ shift.isCompleted ? t('dashboard.shiftDoneShort', '✓ hotovo') : t('dashboard.shiftWaitingShort', 'čeká') }}
              </span>
            </div>
          </div>
        </div>

        <!-- Shared Cart Teaser -->
        <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
              <svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>{{ t('dashboard.flatCart', 'Nákupní košík bytu') }}</span>
            </h2>
            <span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold shrink-0 whitespace-nowrap">
              {{ t('dashboard.itemsLeft', '{count} ks zbývá', { count: cartRemainingCount }) }}
            </span>
          </div>

          <p class="text-xs text-slate-400">
            {{ t('dashboard.remainingToBuy', 'Zbývá nakoupit:') }} <strong>{{ cartRemainingPrice.toLocaleString('cs-CZ') }} CZK</strong>
            <span v-if="cartTotalPrice > cartRemainingPrice" class="text-slate-400"> • {{ t('dashboard.total', 'Celkem') }} {{ cartTotalPrice.toLocaleString('cs-CZ') }} CZK</span>
          </p>

          <div class="space-y-1.5 text-xs">
            <div 
              v-for="item in unpurchasedCartItems.slice(0, 3)"
              :key="item.id"
              class="flex items-center justify-between p-2 rounded-lg bg-slate-850 border border-slate-800"
            >
              <span class="text-slate-300 truncate max-w-[170px]">{{ item.name }}</span>
              <span class="font-mono text-emerald-400 font-semibold">{{ item.qty }}× {{ formatCzk(item.unitPrice) }}</span>
            </div>
            <div v-if="unpurchasedCartItems.length === 0" class="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
              {{ t('dashboard.allItemsPurchased', 'Všechny položky jsou již nakoupené.') }}
            </div>
          </div>

          <button type="button"
            @click="navigateTo('CART')"
            class="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors text-center"
          >
            {{ t('dashboard.openCart', 'Otevřít nákupní košík →') }}
          </button>
        </div>

        <!-- Household Announcements (illustrative demo content) -->
        <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3 text-xs">
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-sm font-bold text-slate-300">
              {{ t('dashboard.announcements', 'Oznámení domácnosti') }}
            </h2>
            <span class="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">Demo</span>
          </div>
          <p class="text-xs text-slate-400">{{ t('dashboard.announcementsDemoNote', 'Ilustrační obsah prototypu – nejde o živá data domácnosti.') }}</p>
          <div class="space-y-2">
            <div class="p-2.5 rounded-lg bg-slate-850 border border-slate-800 flex items-start gap-2">
              <span class="text-emerald-400 font-bold">•</span>
              <div class="text-slate-300">
                <strong>{{ t('dashboard.announcementCleaningLabel', 'Úklid:') }}</strong> {{ t('dashboard.announcementCleaningText', 'Eliška potvrdila úklid koupelny a kuchyňské linky dle rozpisu.') }}
              </div>
            </div>
            <div class="p-2.5 rounded-lg bg-slate-850 border border-slate-800 flex items-start gap-2">
              <span class="text-amber-400 font-bold">•</span>
              <div class="text-slate-300">
                <strong>{{ t('dashboard.announcementInspectionLabel', 'Revize:') }}</strong> {{ t('dashboard.announcementInspectionText', 'Pravidelná revize plynového kotle v bytě proběhne 18. 11. dopoledne.') }}
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import { EXPENSE_BADGE_CLASSES, SETTLEMENT_BADGE_CLASSES } from '../utils/labels'
import { formatDateCz, formatCzk } from '../utils/format'
import { DEMO_TODAY } from '../data/mockData'
import { computed } from 'vue'
import { useSpolubyt } from '../composables/useSpolubyt'
import { t } from '../i18n'
import {
  EXPENSE_STATUS_LABELS,
  SETTLEMENT_STATUS_LABELS
} from '../utils/labels'

const { 
  currentUser,
  managerRoommate,
  managerSettlement,
  isMasterTenant,
  currentUserSettlement,
  currentUserDebt,
  isCurrentUserOverdue,
  currentUserMonthlyExpenses,
  settings, 
  monthlyTotalExpenses, 
  previousMonthTotalExpenses, 
  totalReceivables, 
  debtorsCount, 
  overdueDebtorsCount, 
  settlements, 
  expenses, 
  cartTotalPrice, 
  cartRemainingCount,
  cartRemainingPrice,
  unpurchasedCartItems,
  latestMeters,
  openModal, 
  navigateTo, 
  sendReminder,
  myCurrentCleaningShift,
  currentWeekCleaningShifts,
  toggleShiftStatus,
  annualEnergyPrediction
} = useSpolubyt()

const recentExpenses = computed(() => {
  return expenses.value.slice(0, 4)
})

const debtorsBadgeText = computed(() => {
  if (debtorsCount.value === 0) return t('dashboard.allSettledBadge', 'Vše vyrovnáno')
  if (overdueDebtorsCount.value > 0) {
    return overdueDebtorsCount.value === 1
      ? t('dashboard.overdueOne', '1 po splatnosti')
      : t('dashboard.overdueMany', '{count} po splatnosti', { count: overdueDebtorsCount.value })
  }
  if (debtorsCount.value === 1) return t('dashboard.debtorOne', '1 dlužník')
  if (debtorsCount.value >= 2 && debtorsCount.value <= 4) return t('dashboard.debtorsFew', '{count} dlužníci', { count: debtorsCount.value })
  return t('dashboard.debtorsMany', '{count} dlužníků', { count: debtorsCount.value })
})

const debtorsBadgeClass = computed(() => {
  if (debtorsCount.value === 0) return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
  if (overdueDebtorsCount.value > 0) return 'bg-rose-500/15 text-rose-300 border-rose-500/30'
  return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
})

const overdueDebtorsSubtitle = computed(() => {
  const count = overdueDebtorsCount.value
  if (count === 0) return t('dashboard.noneOverdue', 'Vše před termínem splatnosti')
  if (count === 1) return t('dashboard.overdueMemberOne', '1 člen v prodlení se splátkou')
  if (count >= 2 && count <= 4) return t('dashboard.overdueMembersFew', '{count} členové v prodlení se splátkou', { count })
  return t('dashboard.overdueMembersMany', '{count} členů v prodlení se splátkou', { count })
})

const otherSettlements = computed(() => {
  if (isMasterTenant.value) {
    return settlements.value
  }
  // For members: show the manager first (account holder), then other roommates
  const others = settlements.value.filter(s => s.roommateId !== currentUser.value.id)
  return [
    managerSettlement.value,
    ...others
  ]
})

const getRoommateColor = (roommateId: string) => {
  if (roommateId === 'user-jakub') return 'bg-blue-600'
  if (roommateId === 'user-eliska') return 'bg-purple-600'
  if (roommateId === 'user-martin') return 'bg-amber-600'
  return 'bg-emerald-600'
}

const formatDate = (dateStr: string): string => formatDateCz(dateStr, 'none')

const currentUserDueDateLabel = computed(() => {
  return currentUserSettlement.value?.dueDate
    ? formatDate(currentUserSettlement.value.dueDate)
    : '—'
})

const currentUserDueDateShortLabel = currentUserDueDateLabel

const currentUserDaysOverdue = computed(() => {
  return currentUserSettlement.value?.daysOverdue || 0
})

const currentUserOverdueText = computed(() => {
  const days = currentUserDaysOverdue.value
  if (days === 1) return t('dashboard.overdueDaysOne', '1 den po splatnosti')
  if (days >= 2 && days <= 4) return t('dashboard.overdueDaysFew', '{days} dny po splatnosti', { days })
  return t('dashboard.overdueDaysMany', '{days} dní po splatnosti', { days })
})

const rentDueDate = computed(() => {
  const now = new Date(DEMO_TODAY + 'T12:00:00')
  return new Date(now.getFullYear(), now.getMonth(), settings.value.dueDayOfMonth)
})

const rentDueDateLabel = computed(() => {
  const d = rentDueDate.value
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`
})

const rentDueDateShortLabel = computed(() => {
  const d = rentDueDate.value
  return `${d.getDate()}. ${d.getMonth() + 1}.`
})
</script>

