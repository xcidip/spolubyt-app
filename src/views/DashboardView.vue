<template>
  <div class="space-y-6">
    
    <!-- Top Hero / Welcome Banner -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
      <div>
        <div class="flex items-center gap-2 text-xs font-semibold mb-1" :class="isMasterTenant ? 'text-emerald-400' : 'text-sky-400'">
          <span class="w-2 h-2 rounded-full animate-pulse" :class="isMasterTenant ? 'bg-emerald-500' : 'bg-sky-500'"></span>
          <span>{{ isMasterTenant ? 'Centrální přehled správce bytu' : `Osobní přehled spolubydlícího (${currentUser.role})` }}</span>
        </div>
        <h1 class="text-2xl font-extrabold text-white tracking-tight">
          Vítej zpět, {{ currentUser.name }}
        </h1>
        <p class="text-xs text-slate-400 mt-1">
          Spravovaný byt: <strong class="text-slate-200">{{ settings.name }}</strong> • 
          Pokoj: <strong class="text-slate-200">{{ currentUser.roomName }}</strong> ({{ currentUser.roomAreaM2 }} m², podíl {{ currentUser.areaSharePct }} %)
        </p>
      </div>

      <!-- Contextual Info & Quick Actions -->
      <div class="flex flex-col sm:flex-row sm:items-center gap-3">
        <!-- Weekly Cleaning Status Card (Clickable to Cleaning) -->
        <div
          @click="navigateTo('CLEANING')"
          class="cursor-pointer group flex items-center gap-3 px-3.5 py-2 rounded-xl border transition-all"
          :class="myCurrentCleaningShift?.isCompleted 
            ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20' 
            : 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20'"
          title="Přejít na rozpis úklidu"
        >
          <div class="text-lg">
            {{ myCurrentCleaningShift?.taskKey === 'KITCHEN' ? '🍳' : myCurrentCleaningShift?.taskKey === 'BATHROOM' ? '🚿' : myCurrentCleaningShift?.taskKey === 'CORRIDOR' ? '🧹' : (myCurrentCleaningShift?.taskKey === 'TRASH' ? '♻️' : '✨') }}
          </div>
          <div>
            <div class="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5">
              <span>Úklid tento týden:</span>
              <span 
                class="font-bold text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap shrink-0"
                :class="myCurrentCleaningShift?.isCompleted ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'"
              >
                {{ myCurrentCleaningShift?.isCompleted ? 'Splněno ✓' : 'Čeká na vás' }}
              </span>
            </div>
            <div class="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
              {{ myCurrentCleaningShift ? myCurrentCleaningShift.taskTitle : 'Nemáte přiřazen úklid' }}
            </div>
          </div>
        </div>

        <!-- Quick Action: Zapsat odečet měřidla -->
        <button
          @click="openModal('METER_ADD')"
          class="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shrink-0"
        >
          <svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Zapsat odečet</span>
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
              {{ isMasterTenant ? 'Měsíční náklady bytu (listopad)' : 'Můj měsíční podíl nákladů (listopad)' }}
            </span>
            <span class="text-emerald-400 font-semibold text-[11px] bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 shrink-0 whitespace-nowrap leading-tight">
              {{ isMasterTenant ? '+2,4 % m/m' : `Podíl ${currentUser.areaSharePct} %` }}
            </span>
          </div>
          <div class="text-2xl font-extrabold text-white tracking-tight">
            {{ (isMasterTenant ? monthlyTotalExpenses : currentUserMonthlyExpenses).toLocaleString('cs-CZ') }} CZK
          </div>
        </div>
        <div class="text-xs text-slate-400 mt-2 flex items-center justify-between gap-2 flex-wrap">
          <span v-if="isMasterTenant">Předchozí měsíc: {{ previousMonthTotalExpenses.toLocaleString('cs-CZ') }} CZK</span>
          <span v-else>Celkem náklady bytu: {{ monthlyTotalExpenses.toLocaleString('cs-CZ') }} CZK</span>
          <button @click="navigateTo('EXPENSES')" class="text-emerald-400 hover:underline font-medium text-[11px] shrink-0">
            Výpis →
          </button>
        </div>
      </div>

      <!-- Card 2: Receivables / Personal Debt -->
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between gap-2 flex-wrap text-xs text-slate-400 mb-2">
            <span class="font-semibold text-xs text-slate-400 min-w-0">
              {{ isMasterTenant ? 'Pohledávky správce (dluží bytu)' : 'Můj aktuální nedoplatek (k úhradě)' }}
            </span>
            
            <!-- Badge -->
            <span 
              v-if="isMasterTenant"
              class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0 whitespace-nowrap leading-tight"
              :class="debtorsBadgeClass"
            >
              {{ debtorsBadgeText }}
            </span>
            <span 
              v-else
              class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0 whitespace-nowrap leading-tight"
              :class="[
                isCurrentUserOverdue ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse' :
                currentUserDebt > 0 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              ]"
            >
              {{ isCurrentUserOverdue ? 'Po splatnosti (4 dny)' : (currentUserDebt > 0 ? 'Před splatností' : 'Vyrovnáno') }}
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
            {{ isCurrentUserOverdue ? '⚠️ Splatnost vypršela 01. 11. 2026!' : (currentUserDebt > 0 ? 'Termín splatnosti: 10. 11. 2026' : '✓ Všechny platby máte vyrovnány') }}
          </span>

          <button 
            v-if="!isMasterTenant && currentUserDebt > 0"
            @click="openModal('QR_MODAL', currentUserSettlement)"
            class="text-emerald-400 hover:underline font-bold text-[11px] flex items-center gap-1 shrink-0"
          >
            Zaplatit QR →
          </button>
          <button 
            v-else
            @click="navigateTo('SETTLEMENT')" 
            class="text-emerald-400 hover:underline font-medium text-[11px] shrink-0"
          >
            Vyrovnání →
          </button>
        </div>
      </div>

      <!-- Card 3: Due date to Landlord or to Manager -->
      <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between gap-2 flex-wrap text-xs text-slate-400 mb-2">
            <span class="font-semibold text-xs text-slate-400 min-w-0">
              {{ isMasterTenant ? 'Nájem majiteli (splatnost)' : 'Termín mé úhrady správci' }}
            </span>
            <span 
              class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0 whitespace-nowrap leading-tight"
              :class="[
                isMasterTenant ? 'text-amber-300 bg-amber-500/10 border-amber-500/25' :
                (isCurrentUserOverdue ? 'text-rose-300 bg-rose-500/15 border-rose-500/30' : 
                 (currentUserDebt > 0 ? 'text-amber-300 bg-amber-500/15 border-amber-500/30' : 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30'))
              ]"
            >
              {{ isMasterTenant ? 'Termín: 10. 11.' : (isCurrentUserOverdue ? 'Byl: 01. 11.' : (currentUserDebt > 0 ? 'Termín: 10. 11.' : 'Uhrazeno')) }}
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
              <span>Zbývá 5 dní</span>
              <span class="text-xs font-normal text-slate-400">({{ settings.monthlyRent.toLocaleString('cs-CZ') }} CZK)</span>
            </template>
            <template v-else-if="isCurrentUserOverdue">
              <span>4 dny po termínu</span>
              <span class="text-xs font-normal text-slate-400">({{ currentUserDebt.toLocaleString('cs-CZ') }} CZK)</span>
            </template>
            <template v-else-if="currentUserDebt > 0">
              <span>Zbývá 5 dní</span>
              <span class="text-xs font-normal text-slate-400">({{ currentUserDebt.toLocaleString('cs-CZ') }} CZK)</span>
            </template>
            <template v-else>
              <span>V pořádku</span>
              <span class="text-xs font-normal text-slate-400">(0 CZK nedoplatek)</span>
            </template>
          </div>
        </div>

        <div class="text-xs text-slate-400 mt-2 flex items-center justify-between gap-2 flex-wrap">
          <span v-if="isMasterTenant" class="text-amber-400/90 font-medium min-w-0">Čeká na doplacení podílů</span>
          <span v-else-if="currentUserDebt > 0" class="min-w-0" :class="isCurrentUserOverdue ? 'text-rose-400 font-medium' : 'text-amber-400/90 font-medium'">
            Příjemce: {{ managerRoommate.name }}
          </span>
          <span v-else class="text-emerald-400 font-medium min-w-0">
            Platba za listopad zaúčtována
          </span>

          <span class="text-[11px] text-slate-400 font-medium shrink-0">
            Účet: {{ settings.accountNumber.split(' ')[0] }}
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
                {{ isMasterTenant ? 'Aktuální bilance spolubydlících (pohledávky správce)' : 'Bilance plateb v bytě (můj stav & spolubydlící)' }}
              </h2>
              <p class="text-xs text-slate-400">
                {{ isMasterTenant ? 'Přehled dlužných pohledávek za nájem, energie a společné nákupy' : 'Stav vyrovnání za měsíc listopad 2026' }}
              </p>
            </div>
            <button
              @click="navigateTo('SETTLEMENT')"
              class="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>Celá matice</span>
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
                    <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Vy (přihlášený profil)
                    </span>
                  </div>
                  <div class="text-[11px] text-slate-400">{{ currentUser.roomName }} • {{ currentUser.roomAreaM2 }} m² ({{ currentUser.areaSharePct }} %)</div>
                </div>
              </div>
              
              <div class="text-right">
                <div class="text-xs text-slate-400">Váš nedoplatek:</div>
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
              <div class="flex flex-wrap gap-2 text-[11px] font-mono text-slate-300">
                <span class="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Nájem: {{ currentUserSettlement.breakdown.rent }} Kč</span>
                <span class="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Energie: {{ currentUserSettlement.breakdown.energy }} Kč</span>
                <span v-if="currentUserSettlement.breakdown.wifi" class="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">WiFi: {{ currentUserSettlement.breakdown.wifi }} Kč</span>
                <span v-if="currentUserSettlement.breakdown.drogerie" class="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Drogerie: {{ currentUserSettlement.breakdown.drogerie }} Kč</span>
              </div>

              <button
                @click="openModal('QR_MODAL', currentUserSettlement)"
                class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 transition-all hover:scale-102"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <span>Zaplatit QR kódem</span>
              </button>
            </div>
            <div v-else class="text-xs text-emerald-400/90 pt-1 border-t border-slate-800 flex items-center gap-1.5">
              <span>✓ Všechny platby za listopad máte řádně vyrovnány. Děkujeme za včasnou úhradu!</span>
            </div>
          </div>

          <!-- Section label if member -->
          <div v-if="!isMasterTenant" class="text-xs font-semibold text-slate-400 pt-1">
            Ostatní spolubydlící v bytě:
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
                    <span v-if="s.roommateId === managerRoommate.id" class="text-[10px] text-emerald-400 font-normal">[Správce bytu]</span>
                  </div>
                  <div class="text-[11px] text-slate-400">{{ s.roomName }}</div>
                </div>
              </div>

              <!-- Debt and status -->
              <div class="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                <div class="text-right">
                  <div class="text-sm font-mono font-bold" :class="s.totalDebt > 0 ? 'text-amber-400' : 'text-emerald-400'">
                    {{ s.totalDebt.toLocaleString('cs-CZ') }} CZK
                  </div>
                  <div class="text-[10px]">
                    <span 
                      class="px-2 py-0.5 rounded font-semibold text-[10px]"
                      :class="[
                        s.status === 'VYROVNÁNO' ? 'bg-emerald-500/20 text-emerald-300' :
                        s.status === 'PO_SPLATNOSTI' ? 'bg-rose-500/20 text-rose-300 animate-pulse' :
                        'bg-amber-500/20 text-amber-300'
                      ]"
                    >
                      {{ s.status === 'PO_SPLATNOSTI' ? 'Po splatnosti (4 dny)' : (s.status === 'VYROVNÁNO' ? 'Vyrovnáno' : 'Před splatností') }}
                    </span>
                  </div>
                </div>

                <!-- Actions: Full actions for Manager, read-only/QR for members -->
                <div class="flex items-center gap-1.5 shrink-0">
                  <button
                    v-if="s.totalDebt > 0"
                    @click="openModal('QR_MODAL', s)"
                    class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1"
                    title="Zobrazit SPAYD QR kód pro mobilní platbu"
                  >
                    <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    <span>QR</span>
                  </button>

                  <!-- Upomínka only for Master Tenant -->
                  <button
                    v-if="isMasterTenant && s.status === 'PO_SPLATNOSTI'"
                    @click="sendReminder(s.roommateId)"
                    class="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors"
                    title="Odeslat diskrétní upomínku dlužníkovi"
                  >
                    Upomínka
                  </button>

                  <!-- Zaplaceno only for Master Tenant -->
                  <button
                    v-if="isMasterTenant && s.totalDebt > 0"
                    @click="openModal('CONFIRM_MODAL', s)"
                    class="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-sm"
                    title="Označit platbu jako zaplacenou"
                  >
                    Zaplaceno
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
                Poslední výdaje a nákupy
              </h2>
              <p class="text-xs text-slate-400">Chronologický přehled nedávných transakcí</p>
            </div>
            <button
              @click="navigateTo('EXPENSES')"
              class="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>Všechny výdaje</span>
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div class="border border-slate-800 rounded-xl overflow-hidden bg-slate-850">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-800/80 text-slate-400 border-b border-slate-700">
                <tr>
                  <th class="py-2.5 px-3">Datum</th>
                  <th class="py-2.5 px-3">Název výdaje</th>
                  <th class="py-2.5 px-3">Plátce</th>
                  <th class="py-2.5 px-3 text-right">Částka</th>
                  <th class="py-2.5 px-3 text-center">Stav</th>
                  <th class="py-2.5 px-3 text-right">Akce</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800">
                <tr 
                  v-for="exp in recentExpenses" 
                  :key="exp.id" 
                  @click="openModal('EXP_DETAIL', exp)"
                  class="hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <td class="py-2.5 px-3 font-mono text-slate-400">{{ formatDate(exp.date) }}</td>
                  <td class="py-2.5 px-3 font-medium text-slate-200">
                    {{ exp.title }}
                  </td>
                  <td class="py-2.5 px-3 text-slate-400">{{ exp.payerName }}</td>
                  <td class="py-2.5 px-3 font-mono font-bold text-slate-100 text-right">
                    {{ exp.totalAmount.toLocaleString('cs-CZ') }} CZK
                  </td>
                  <td class="py-2.5 px-3 text-center">
                    <span 
                      class="px-2 py-0.5 rounded text-[10px] font-bold"
                      :class="exp.status === 'UHRAZENO' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'"
                    >
                      {{ exp.status }}
                    </span>
                  </td>
                  <td class="py-2.5 px-3 text-right">
                    <span class="text-emerald-400 font-semibold hover:underline">Detail →</span>
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
              <span>Energie a měřidla</span>
            </h2>
            <button
              @click="navigateTo('ENERGY')"
              class="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Detail →
            </button>
          </div>

          <!-- Teploměr záloh (annualEnergyPrediction) -->
          <div class="space-y-1.5 p-3 rounded-xl bg-slate-850 border border-slate-800">
            <div class="flex justify-between items-center text-xs">
              <span class="text-slate-400">Čerpání ročních záloh:</span>
              <span 
                class="font-bold font-mono"
                :class="annualEnergyPrediction.drawdownPct > 100 ? 'text-amber-400' : 'text-emerald-400'"
              >
                {{ annualEnergyPrediction.drawdownPct }} % ({{ annualEnergyPrediction.riskLevel }})
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
            <div class="text-[10px] text-slate-500 flex justify-between gap-1">
              <span>0 %</span>
              <span>Odhad {{ annualEnergyPrediction.isSurplus ? 'přeplatku' : 'nedoplatku' }}: <strong :class="annualEnergyPrediction.isSurplus ? 'text-emerald-400' : 'text-rose-400'">{{ annualEnergyPrediction.formattedDelta }}</strong></span>
              <span>100 % (Zálohová hranice)</span>
            </div>
          </div>

          <!-- Latest readings summary -->
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="p-2.5 rounded-lg bg-slate-850 border border-slate-800">
              <div class="text-[10px] text-slate-400">Elektřina (kWh)</div>
              <div class="font-mono font-bold text-slate-200 mt-0.5">14 820 kWh</div>
              <div class="text-[10px] text-emerald-400">+185 za říjen</div>
            </div>
            <div class="p-2.5 rounded-lg bg-slate-850 border border-slate-800">
              <div class="text-[10px] text-slate-400">Plyn (m³)</div>
              <div class="font-mono font-bold text-slate-200 mt-0.5">3 410 m³</div>
              <div class="text-[10px] text-emerald-400">+28 za říjen</div>
            </div>
          </div>

          <button
            @click="openModal('METER_ADD')"
            class="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Zadat stav měřidla</span>
          </button>
        </div>

        <!-- Weekly Cleaning Shift Widget -->
        <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
              <svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span>Úklid tento týden</span>
            </h2>
            <button
              @click="navigateTo('CLEANING')"
              class="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Rozpis →
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
                <span class="text-[11px] font-bold" :class="myCurrentCleaningShift.isCompleted ? 'text-emerald-400' : 'text-amber-400'">
                  {{ myCurrentCleaningShift.isCompleted ? '✓ Tvoje směna je splněna' : '⏳ Tvoje směna tento týden' }}
                </span>
                <h3 class="text-xs font-bold text-white mt-0.5">
                  {{ myCurrentCleaningShift.taskTitle }}
                </h3>
              </div>
              <span 
                class="text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap"
                :class="myCurrentCleaningShift.isCompleted ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'"
              >
                {{ myCurrentCleaningShift.isCompleted ? 'Splněno' : 'Do neděle' }}
              </span>
            </div>

            <!-- Confirm button directly on dashboard -->
            <button
              v-if="!myCurrentCleaningShift.isCompleted"
              @click="toggleShiftStatus(myCurrentCleaningShift.id)"
              class="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>Označit můj úklid jako hotový</span>
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
                class="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 font-mono"
                :class="shift.isCompleted ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 bg-slate-800'"
              >
                {{ shift.isCompleted ? '✓ hotovo' : 'čeká' }}
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
              <span>Nákupní košík bytu</span>
            </h2>
            <span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold shrink-0 whitespace-nowrap">
              {{ cartTotalCount }} ks
            </span>
          </div>

          <p class="text-xs text-slate-400">
            Položky k nákupu: <strong>{{ cartTotalPrice.toLocaleString('cs-CZ') }} CZK</strong>
          </p>

          <div class="space-y-1.5 text-xs">
            <div 
              v-for="item in cartItems.slice(0, 3)" 
              :key="item.id"
              class="flex items-center justify-between p-2 rounded-lg bg-slate-850 border border-slate-800"
            >
              <span class="text-slate-300 truncate max-w-[170px]">{{ item.name }}</span>
              <span class="font-mono text-emerald-400 font-semibold">{{ item.qty }}× {{ item.unitPrice }} Kč</span>
            </div>
          </div>

          <button
            @click="navigateTo('CART')"
            class="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors text-center"
          >
            Otevřít nákupní košík →
          </button>
        </div>

        <!-- Household Announcements -->
        <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3 text-xs">
          <h2 class="text-sm font-bold text-slate-300">
            Oznámení domácnosti
          </h2>
          <div class="space-y-2">
            <div class="p-2.5 rounded-lg bg-slate-850 border border-slate-800 flex items-start gap-2">
              <span class="text-emerald-400 font-bold">•</span>
              <div class="text-slate-300">
                <strong>Úklid:</strong> Eliška potvrdila úklid koupelny a kuchyňské linky dle rozpisu.
              </div>
            </div>
            <div class="p-2.5 rounded-lg bg-slate-850 border border-slate-800 flex items-start gap-2">
              <span class="text-amber-400 font-bold">•</span>
              <div class="text-slate-300">
                <strong>Revize:</strong> Pravidelná revize plynového kotle v bytě proběhne 18. 11. dopoledne.
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSpolubyt } from '../composables/useSpolubyt'

const { 
  currentUser,
  managerRoommate,
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
  cartItems, 
  cartTotalCount, 
  cartTotalPrice, 
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
  if (debtorsCount.value === 0) return 'Vše vyrovnáno'
  if (overdueDebtorsCount.value > 0) {
    return overdueDebtorsCount.value === 1 ? '1 po splatnosti' : `${overdueDebtorsCount.value} po splatnosti`
  }
  if (debtorsCount.value === 1) return '1 dlužník'
  if (debtorsCount.value >= 2 && debtorsCount.value <= 4) return `${debtorsCount.value} dlužníci`
  return `${debtorsCount.value} dlužníků`
})

const debtorsBadgeClass = computed(() => {
  if (debtorsCount.value === 0) return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
  if (overdueDebtorsCount.value > 0) return 'bg-rose-500/15 text-rose-300 border-rose-500/30'
  return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
})

const overdueDebtorsSubtitle = computed(() => {
  const count = overdueDebtorsCount.value
  if (count === 0) return 'Vše před termínem splatnosti'
  if (count === 1) return '1 člen v prodlení se splátkou'
  if (count >= 2 && count <= 4) return `${count} členové v prodlení se splátkou`
  return `${count} členů v prodlení se splátkou`
})

const otherSettlements = computed(() => {
  if (isMasterTenant.value) {
    return settlements.value
  }
  // For members: show the manager first (account holder), then other roommates
  const others = settlements.value.filter(s => s.roommateId !== currentUser.value.id)
  return [
    {
      roommateId: managerRoommate.value.id,
      roommateName: managerRoommate.value.name,
      roomName: managerRoommate.value.roomName,
      roomAreaM2: managerRoommate.value.roomAreaM2,
      areaSharePct: managerRoommate.value.areaSharePct,
      totalDebt: 0,
      breakdown: { rent: 0, energy: 0 },
      dueDate: '2026-11-10',
      daysOverdue: 0,
      status: 'VYROVNÁNO' as const
    },
    ...others
  ]
})

const getRoommateColor = (roommateId: string) => {
  if (roommateId === 'user-jakub') return 'bg-blue-600'
  if (roommateId === 'user-eliska') return 'bg-purple-600'
  if (roommateId === 'user-martin') return 'bg-amber-600'
  return 'bg-emerald-600'
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}. ${parts[1]}.`
  }
  return dateStr
}
</script>

