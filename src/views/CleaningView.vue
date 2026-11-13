<template>
  <div class="space-y-6">
    
    <!-- Top Header & Role Indicator -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
      <div>
        <div class="flex items-center gap-2 text-xs font-semibold mb-1" :class="isMasterTenant ? 'text-emerald-400' : 'text-sky-400'">
          <span class="w-2 h-2 rounded-full animate-pulse" :class="isMasterTenant ? 'bg-emerald-500' : 'bg-sky-500'"></span>
          <span>{{ isMasterTenant ? t('cleaning.headerAdmin', 'Správa úklidových směn (Správce bytu)') : t('cleaning.headerMember', 'Úklidové směny spolubydlícího ({role})', { role: t('roles.' + currentUser.role, currentUser.role) }) }}</span>
        </div>
        <h1 class="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <span>{{ t('cleaning.title', 'Úklidové směny a rotace') }}</span>
          <span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold font-mono">
            {{ t('cleaning.zoneCount', '{zones} zóny • {members} spolubydlící', { zones: cleaningTaskDefs.length, members: roommates.length }) }}
          </span>
        </h1>
        <p class="text-xs text-slate-400 mt-1">
          {{ t('cleaning.subtitle', 'Férová týdenní rotace povinností ve společných prostorách. Každá akce se dokončuje týdně a role se postupně střídají.') }}
        </p>
      </div>
    </div>

    <!-- Permission Rule Banner -->
    <div 
      class="p-4 rounded-xl border flex items-start gap-3.5 transition-colors"
      :class="[
        isMasterTenant 
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' 
          : 'bg-sky-500/10 border-sky-500/30 text-sky-200'
      ]"
    >
      <div class="p-2 rounded-lg shrink-0 text-lg" :class="isMasterTenant ? 'bg-emerald-500/20 text-emerald-300' : 'bg-sky-500/20 text-sky-300'">
        {{ isMasterTenant ? '🛡️' : '🔒' }}
      </div>
      <div class="text-xs space-y-1">
        <div class="font-bold text-xs">
          {{ isMasterTenant ? t('cleaning.permAdmin', 'Oprávnění správce bytu (plný přístup)') : t('cleaning.permMember', 'Oprávnění člena bytu (omezený přístup)') }}
        </div>
        <p v-if="isMasterTenant" class="text-slate-300">
          {{ t('cleaning.signedInAs', 'Jste přihlášen jako') }} <strong>{{ currentUser.name }} ({{ t('cleaning.roleAdmin', 'Správce bytu') }})</strong>. {{ t('cleaning.permAdminCan', 'Můžete potvrdit, schválit nebo zrušit') }}
          <strong>{{ t('cleaning.permAdminAny', 'libovolnou úklidovou směnu') }}</strong> {{ t('cleaning.permAdminOf', 'kteréhokoli spolubydlícího.') }}
        </p>
        <p v-else class="text-slate-300">
          {{ t('cleaning.signedInAs', 'Jste přihlášen jako') }} <strong>{{ currentUser.name }} ({{ t('cleaning.roleMember', 'Člen') }})</strong>. {{ t('cleaning.permMemberRules', 'Podle domovního řádu máte oprávnění') }}
          <strong>{{ t('cleaning.permMemberOnly', 'potvrdit pouze svoji vlastní směnu') }}</strong>. {{ t('cleaning.permMemberLocked', 'U směn ostatních spolubydlících je potvrzení uzamčeno (můžete jim pouze poslat připomínku).') }}
        </p>
      </div>
    </div>

    <!-- Actionable Banner for Incoming Shift Swap Requests for Current User -->
    <div 
      v-if="pendingIncomingSwaps.length > 0"
      class="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-purple-900/40 to-slate-900 border border-purple-500/40 shadow-xl space-y-3"
    >
      <div class="flex items-center gap-2 text-xs font-bold text-purple-300">
        <span class="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse"></span>
        <span>{{ t('cleaning.incomingSwapTitle', 'Žádost o převzetí směny k vyřízení') }}</span>
      </div>
      <div 
        v-for="shift in pendingIncomingSwaps" 
        :key="shift.id" 
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-purple-900/30 p-3.5 rounded-xl border border-purple-500/30"
      >
        <div class="space-y-0.5">
          <div class="text-sm font-bold text-white flex items-center gap-2">
            <span>{{ shift.swapRequest?.requestedByRoommateName }}</span>
            <span class="text-xs text-purple-300 font-normal">{{ t('cleaning.swapAsksYou', 'tě žádá o převzetí směny:') }}</span>
            <span class="text-xs font-semibold text-white px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/30">
              {{ t('cleaning.task.' + shift.taskKey.toLowerCase(), shift.taskTitle) }} ({{ formatCleaningWeek(shift) }})
            </span>
          </div>
          <div v-if="shift.swapRequest?.note" class="text-xs text-slate-300 italic">
            "{{ shift.swapRequest?.note }}"
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button type="button"
            @click="acceptShiftSwap(shift.id)"
            class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/30 flex items-center gap-1.5"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
            <span>{{ t('cleaning.acceptSwap', 'Převzít směnu') }}</span>
          </button>
          <button type="button"
            @click="rejectShiftSwap(shift.id)"
            class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
          >
            {{ t('cleaning.reject', 'Odmítnout') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Week Navigator & Progress -->
    <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <!-- Week Controls -->
        <div class="flex items-center gap-2">
          <button type="button"
            @click="selectCleaningWeek(selectedCleaningWeek - 1)"
            class="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors"
            :title="t('cleaning.prevWeek', 'Předchozí týden')"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div class="px-3.5 py-1.5 rounded-xl bg-slate-850 border border-slate-750 flex items-center gap-2">
            <span class="text-sm font-bold text-white tracking-wide">
              {{ currentWeekLabel }}
            </span>
            <span 
              class="text-xs font-semibold px-2 py-0.5 rounded-md border"
              :class="[
                selectedCleaningWeek === currentWeekNumber 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                  : selectedCleaningWeek < currentWeekNumber 
                    ? 'bg-slate-800 text-slate-400 border-slate-700' 
                    : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
              ]"
            >
              {{ selectedCleaningWeek === currentWeekNumber ? t('cleaning.currentWeek', 'Aktuální týden') : (selectedCleaningWeek < currentWeekNumber ? t('cleaning.pastWeek', 'Minulý týden') : t('cleaning.futurePlan', 'Budoucí rozpis')) }}
            </span>
          </div>

          <button type="button"
            @click="selectCleaningWeek(selectedCleaningWeek + 1)"
            class="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors"
            :title="t('cleaning.nextWeek', 'Další týden')"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button type="button"
            v-if="selectedCleaningWeek !== currentWeekNumber"
            @click="selectCleaningWeek(currentWeekNumber)"
            class="text-xs px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-slate-700 font-medium transition-colors ml-1"
          >
            {{ t('cleaning.todayWeek', 'Dnes / Tento týden') }}
          </button>
        </div>

        <!-- Weekly Progress Stats -->
        <div class="flex flex-wrap items-center gap-3">
          <div class="text-right">
            <div class="text-xs font-semibold text-slate-300">
              {{ t('cleaning.completedLabel', 'Splněno') }}: <span class="text-white font-mono font-bold">{{ completedCount }}/{{ activeShifts.length }}</span> {{ t('cleaning.shiftsUnit', 'směn') }}
            </div>
            <div class="text-xs text-slate-400">
              {{ activeShifts.length === 0
                ? t('cleaning.noShiftsPlanned', 'Pro tento týden nejsou naplánované směny.')
                : (completedCount === activeShifts.length
                  ? t('cleaning.allZonesDone', 'Všechny zóny uklizeny 👏')
                  : t('cleaning.zonesLeft', '{count} zón zbývá uklidit', { count: activeShifts.length - completedCount })) }}
            </div>
          </div>
          <div class="w-24 sm:w-32 bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700/60 p-0.5">
            <div 
              class="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-500 to-teal-400"
              :style="{ width: `${progressPct}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 4 Duty Cards Grid -->
    <div v-if="activeShifts.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div 
        v-for="taskDef in cleaningTaskDefs"
        :key="taskDef.key"
        class="rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-lg relative"
        :class="[
          getShiftForTask(taskDef.key)?.isCompleted 
            ? 'bg-emerald-950/20 border-emerald-500/30' 
            : isMyShift(getShiftForTask(taskDef.key))
              ? 'bg-slate-900 border-amber-500/40 ring-1 ring-amber-500/30'
              : 'bg-slate-900 border-slate-800'
        ]"
      >
        <!-- Top Card Header -->
        <div class="p-5 pb-4 border-b border-slate-800/80">
          <div class="flex items-start justify-between gap-3 max-sm:flex-col">
            <div class="flex items-center gap-3 min-w-0">
              <!-- Zone Icon -->
              <div 
                class="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-inner"
                :class="getIconBg(taskDef.key)"
              >
                <span v-if="taskDef.key === 'KITCHEN'">🍳</span>
                <span v-else-if="taskDef.key === 'BATHROOM'">🚿</span>
                <span v-else-if="taskDef.key === 'CORRIDOR'">🧹</span>
                <span v-else-if="taskDef.key === 'TRASH'">♻️</span>
              </div>
              <div class="min-w-0">
                <div class="text-xs font-bold" :class="getTitleColor(taskDef.key)">
                  {{ t('cleaning.taskShort.' + taskDef.key.toLowerCase(), taskDef.shortTitle) }}
                </div>
                <h3 class="text-base font-bold text-white tracking-tight truncate max-sm:whitespace-normal">
                  {{ t('cleaning.task.' + taskDef.key.toLowerCase(), taskDef.title) }}
                </h3>
              </div>
            </div>

            <!-- Status Pill -->
            <div class="shrink-0 flex items-center gap-1.5">
              <span 
                v-if="getShiftForTask(taskDef.key)?.isCompleted"
                class="text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>{{ t('cleaning.doneBadge', 'Splněno') }}</span>
              </span>
              <span 
                v-else-if="getShiftForTask(taskDef.key)?.swapRequest?.status === 'PENDING'"
                class="text-xs px-2.5 py-1 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5 shadow-sm"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
                <span>{{ t('cleaning.pendingBadge', 'čekající žádost') }}</span>
              </span>
              <span 
                v-else
                class="text-xs px-2.5 py-1 rounded-full font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/25 flex items-center gap-1.5"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                <span>{{ t('cleaning.waitingBadge', 'Čeká na splnění') }}</span>
              </span>
            </div>
          </div>

          <!-- Description -->
          <p class="text-xs text-slate-400 mt-2.5 leading-relaxed">
            {{ t('cleaning.taskDescription.' + taskDef.key.toLowerCase(), taskDef.description) }}
          </p>
        </div>

        <!-- Middle Card: Assigned Flatmate & Subtasks -->
        <div class="p-5 space-y-4 flex-1">
          <!-- Roommate Assignment Box -->
          <div 
            class="p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors max-sm:flex-col max-sm:items-start"
            :class="[
              isMyShift(getShiftForTask(taskDef.key))
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-slate-850/70 border-slate-800'
            ]"
          >
            <div class="flex items-center gap-3 min-w-0">
              <!-- Avatar -->
              <div 
                class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shrink-0 text-xs shadow"
                :class="getRoommate(getShiftForTask(taskDef.key)?.roommateId)?.avatarColor || 'bg-slate-700'"
              >
                {{ getRoommate(getShiftForTask(taskDef.key)?.roommateId)?.avatarInitial || '?' }}
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-2 max-sm:flex-wrap">
                  <span class="text-xs font-bold text-white truncate max-sm:whitespace-normal">
                    {{ getShiftForTask(taskDef.key)?.roommateName }}
                  </span>
                  <span 
                    v-if="isMyShift(getShiftForTask(taskDef.key))"
                    class="text-xs font-bold px-2 py-0.5 rounded bg-amber-500 text-slate-950 max-sm:whitespace-nowrap"
                  >
                    {{ t('cleaning.myShift', 'Moje směna') }}
                  </span>
                </div>
                <div class="text-xs text-slate-400">
                  {{ getRoommate(getShiftForTask(taskDef.key)?.roommateId)?.roomName }} • 
                  {{ t('roles.' + getRoommate(getShiftForTask(taskDef.key)?.roommateId)?.role, getRoommate(getShiftForTask(taskDef.key)?.roommateId)?.role || '') }}
                </div>
              </div>
            </div>

            <!-- Due date / Done timestamp -->
            <div class="text-right shrink-0 max-sm:text-left">
              <div v-if="getShiftForTask(taskDef.key)?.isCompleted" class="text-xs text-emerald-400 font-mono">
                {{ getShiftForTask(taskDef.key)?.completedAt }}
              </div>
              <div v-else class="text-xs text-slate-400">
                {{ t('cleaning.dueLabel', 'Termín:') }} <strong class="text-slate-300">{{ t('cleaning.dueValue', 'Do neděle') }}</strong>
              </div>
            </div>
          </div>

          <!-- Pending Swap Banner on Shift Card -->
          <div 
            v-if="getShiftForTask(taskDef.key)?.swapRequest?.status === 'PENDING'"
            class="p-3.5 rounded-xl border space-y-2"
            :class="[
              isSwapRecipient(getShiftForTask(taskDef.key))
                ? 'bg-purple-950/40 border-purple-500/40'
                : 'bg-purple-950/20 border-purple-500/30'
            ]"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2 text-xs font-bold text-purple-300">
                <span class="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                <span>{{ t('cleaning.pendingSwapWith', 'Čekající žádost: převzetí uživatelem {name}', { name: getShiftForTask(taskDef.key)?.swapRequest?.targetRoommateName }) }}</span>
              </div>
              <button type="button"
                v-if="canCancelSwap(getShiftForTask(taskDef.key))"
                @click="cancelShiftSwap(getShiftForTask(taskDef.key)!.id)"
                class="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                :title="t('cleaning.cancelSwapTitle', 'Odvolat žádost o převzetí směny')"
              >
                {{ t('cleaning.cancelRequest', 'Zrušit žádost') }}
              </button>
            </div>
            
            <div v-if="getShiftForTask(taskDef.key)?.swapRequest?.note" class="text-xs text-slate-300 italic">
              {{ t('cleaning.noteLabel', 'Poznámka:') }} "{{ getShiftForTask(taskDef.key)?.swapRequest?.note }}"
            </div>
            <div class="text-xs text-slate-400 flex items-center gap-2">
              <span>{{ t('cleaning.requesterLabel', 'Žadatel:') }} <strong class="text-slate-200">{{ getShiftForTask(taskDef.key)?.swapRequest?.requestedByRoommateName }}</strong></span>
              <span>•</span>
              <span>{{ t('cleaning.submittedLabel', 'Podáno:') }} {{ getShiftForTask(taskDef.key)?.swapRequest?.createdAt }}</span>
            </div>

            <!-- Recipient Action inside card -->
            <div 
              v-if="isSwapRecipient(getShiftForTask(taskDef.key))"
              class="pt-1.5 flex items-center gap-2 border-t border-purple-500/20"
            >
              <button type="button"
                @click="acceptShiftSwap(getShiftForTask(taskDef.key)!.id)"
                class="flex-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>{{ t('cleaning.acceptSwap', 'Převzít směnu') }}</span>
              </button>
              <button type="button"
                @click="rejectShiftSwap(getShiftForTask(taskDef.key)!.id)"
                class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
              >
                {{ t('cleaning.reject', 'Odmítnout') }}
              </button>
            </div>
          </div>

          <!-- Subtasks Checklist -->
          <div class="space-y-1.5 pt-1">
            <div class="text-xs font-bold text-slate-400">
              {{ t('cleaning.checklistTitle', 'Doporučený kontrolní seznam:') }}
            </div>
            <ul class="space-y-1 text-xs text-slate-300">
              <li 
                v-for="(subtask, idx) in taskDef.subtasks" 
                :key="idx"
                class="flex items-start gap-2 py-0.5"
              >
                <svg 
                  class="w-4 h-4 mt-0.5 shrink-0" 
                  :class="getShiftForTask(taskDef.key)?.isCompleted ? 'text-emerald-400' : 'text-slate-400'"
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span :class="getShiftForTask(taskDef.key)?.isCompleted ? 'line-through text-slate-400' : 'text-slate-300'">{{ t('cleaning.subtasks.' + taskDef.key.toLowerCase() + idx, subtask) }}</span>
              </li>
            </ul>
          </div>

          <!-- Completed by audit if done -->
          <div 
            v-if="getShiftForTask(taskDef.key)?.isCompleted"
            class="text-xs text-slate-300 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
          >
            <div class="flex items-center gap-1.5">
              <span class="text-emerald-400 font-bold">✓ {{ t('cleaning.doneBadge', 'Splněno') }}</span>
              <span>— {{ t('cleaning.confirmedBy', 'potvrdil(a):') }} <strong class="text-white">{{ getShiftForTask(taskDef.key)?.completedBy }}</strong></span>
            </div>
            <div v-if="getShiftForTask(taskDef.key)?.completedAt" class="text-emerald-300 font-mono text-xs">
              {{ getShiftForTask(taskDef.key)?.completedAt }}
            </div>
            <div v-if="getShiftForTask(taskDef.key)?.notes" class="text-slate-400 italic">
              "{{ getShiftForTask(taskDef.key)?.notes }}"
            </div>
          </div>
        </div>

        <!-- Card Footer: Actions with strict permission control -->
        <div class="p-4 bg-slate-950/60 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5">
          
          <!-- Case 1: Current user HAS permission (is the assigned flatmate OR is Správce) -->
          <template v-if="canUserConfirm(getShiftForTask(taskDef.key))">
            
            <!-- Not completed: Primary Confirm Button -->
            <button type="button"
              v-if="!getShiftForTask(taskDef.key)?.isCompleted"
              @click="handleConfirmShift(getShiftForTask(taskDef.key)!)"
              class="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all hover:scale-105"
              :class="[
                isMyShift(getShiftForTask(taskDef.key))
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/40'
                  : 'bg-emerald-600/90 hover:bg-emerald-600 text-white'
              ]"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <span>
                {{ isMyShift(getShiftForTask(taskDef.key)) ? t('cleaning.confirmDone', 'Potvrdit hotový úklid') : t('cleaning.confirmForOther', 'Potvrdit za spolubydlícího (Správce)') }}
              </span>
            </button>

            <!-- Completed: Revert Button -->
            <button type="button"
              v-else
              @click="handleConfirmShift(getShiftForTask(taskDef.key)!)"
              class="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{{ t('cleaning.revertConfirm', 'Zrušit potvrzení (vrátit zpět)') }}</span>
            </button>

          </template>

          <!-- Case 2: Current user DOES NOT have permission (foreign duty, not Správce) -->
          <template v-else>
            <div class="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <!-- Disabled Locked Button -->
              <button type="button"
                disabled
                class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-800/40 text-slate-400 text-xs font-medium border border-slate-800 cursor-not-allowed"
                :title="t('cleaning.lockedTitle', 'Tuto směnu smí potvrdit pouze {name} nebo správce bytu.', { name: getShiftForTask(taskDef.key)?.roommateName })"
              >
                <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>{{ t('cleaning.lockedLabel', 'Uzamčeno (pouze pro {name})', { name: getShiftForTask(taskDef.key)?.roommateName.split(' ')[0] }) }}</span>
              </button>

              <!-- Reminder Button if not completed -->
              <button type="button"
                v-if="!getShiftForTask(taskDef.key)?.isCompleted"
                @click="sendCleaningReminder(getShiftForTask(taskDef.key)!.id)"
                class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-sky-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-1.5 shrink-0"
                :title="t('cleaning.remindTitle', 'Poslat spolubydlícímu přátelské upozornění na blížící se termín')"
              >
                <svg class="w-3.5 h-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span>{{ t('cleaning.remind', 'Připomenout') }}</span>
              </button>
            </div>
          </template>

          <!-- Shift Swap Request Button for uncompleted shifts without pending swap -->
          <button type="button"
            v-if="!getShiftForTask(taskDef.key)?.isCompleted && getShiftForTask(taskDef.key)?.swapRequest?.status !== 'PENDING'"
            @click="openSwapModal(getShiftForTask(taskDef.key)!)"
            class="px-3.5 py-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/40 text-purple-300 hover:text-purple-200 text-xs font-semibold border border-purple-500/30 transition-all flex items-center gap-1.5 shrink-0"
            :title="t('cleaning.swapTitle', 'Požádat spolubydlícího o převzetí směny')"
          >
            <span>{{ t('cleaning.swapShort', 'Převzetí směny') }}</span>
          </button>

        </div>
      </div>
    </div>

    <div v-else class="p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg text-center space-y-3">
      <div class="text-3xl">🧹</div>
      <div class="space-y-1">
        <p class="text-sm font-semibold text-slate-200">{{ t('cleaning.emptyTitle', 'Pro vybraný týden nejsou k dispozici žádné úklidové směny.') }}</p>
        <p class="text-xs text-slate-400">{{ t('cleaning.emptyHint', 'Zkuste zvolit aktuální týden nebo posunout rozpis na další týden.') }}</p>
      </div>
      <button type="button"
        @click="selectCleaningWeek(currentWeekNumber)"
        class="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-slate-700 font-medium transition-colors"
      >
        {{ t('cleaning.showCurrentWeek', 'Zobrazit aktuální týden') }}
      </button>
    </div>

    <!-- 4-Week Rotation Matrix / Harmonogram -->
    <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div>
          <h2 class="text-sm font-bold text-white flex items-center gap-2">
            <span>{{ t('cleaning.rotationTitle', 'Harmonogram rotace na 4 týdny') }}</span>
            <span class="text-xs text-emerald-400 font-normal">{{ t('cleaning.rotationSubtitle', 'Posun každé pondělí o 1 zónu') }}</span>
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">
            {{ t('cleaning.rotationHint', 'Přehled toho, kdo má jakou povinnost v jednotlivých týdnech. Všichni spolubydlící tak vystřídají každou zónu právě jednou za měsíc.') }}
          </p>
        </div>
      </div>

      <!-- Rotation Matrix Table -->
      <div class="border border-slate-800 rounded-xl overflow-x-auto bg-slate-850" tabindex="0" role="region" :aria-label="t('cleaning.rotationAriaLabel', 'Harmonogram rotace úklidu')">
        <p class="px-3 pt-2 text-xs text-slate-400 md:hidden">{{ t('cleaning.scrollHint', 'Tabulku lze posouvat vodorovně →') }}</p>
        <table class="w-full min-w-[720px] text-left text-xs whitespace-nowrap">
          <thead class="bg-slate-800/80 text-slate-300 border-b border-slate-700">
            <tr>
              <th class="p-3.5 font-bold">{{ t('cleaning.zoneColumn', 'Úklidová zóna') }}</th>
              <th 
                v-for="w in rotationWeeks" 
                :key="w.number"
                class="p-3.5 font-bold text-center"
                :class="w.number === currentWeekNumber ? 'bg-emerald-500/10 text-emerald-300' : ''"
              >
                <div class="flex items-center justify-center gap-1.5">
                  <span>{{ w.label }}</span>
                  <span 
                    v-if="w.number === currentWeekNumber"
                    class="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  >
                    {{ t('cleaning.todayBadge', 'Dnes') }}
                  </span>
                </div>
                <div class="text-xs text-slate-400 font-normal">{{ w.dates }}</div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            <tr 
              v-for="task in cleaningTaskDefs" 
              :key="task.key"
              class="hover:bg-slate-800/40 transition-colors"
            >
              <!-- Task Title -->
              <td class="p-3.5 font-semibold text-slate-200">
                <div class="flex items-center gap-2.5">
                  <span class="text-base">
                    {{ task.key === 'KITCHEN' ? '🍳' : task.key === 'BATHROOM' ? '🚿' : task.key === 'CORRIDOR' ? '🧹' : '♻️' }}
                  </span>
                  <div>
                    <div>{{ t('cleaning.task.' + task.key.toLowerCase(), task.title) }}</div>
                    <div class="text-xs text-slate-400">{{ t('cleaning.taskShort.' + task.key.toLowerCase(), task.shortTitle) }}</div>
                  </div>
                </div>
              </td>

              <!-- Flatmate assignment per week -->
              <td 
                v-for="w in rotationWeeks" 
                :key="w.number"
                class="p-3.5 text-center"
                :class="w.number === currentWeekNumber ? 'bg-emerald-500/5' : ''"
              >
                <div 
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors"
                  :class="[
                    assignedRoommate(task.key, w.number)?.id === currentUser.id
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-200 font-bold'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
                  ]"
                >
                  <div 
                    class="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    :class="assignedRoommate(task.key, w.number)?.avatarColor || 'bg-slate-700'"
                  >
                    {{ assignedRoommate(task.key, w.number)?.avatarInitial }}
                  </div>
                  <span>{{ assignedRoommate(task.key, w.number)?.name.split(' ')[0] }}</span>
                  <span 
                    v-if="assignedRoommate(task.key, w.number)?.id === currentUser.id"
                    class="text-xs bg-amber-500 text-slate-950 px-1 rounded font-extrabold"
                  >
                    {{ t('cleaning.youBadge', 'Ty') }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- House Agreement & Rules -->
    <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
      <h2 class="text-sm font-bold text-white flex items-center gap-2">
        <span>{{ t('cleaning.rulesTitle', 'Domovní dohoda a pravidla úklidu') }}</span>
        <span class="text-xs text-slate-400 font-normal">{{ t('cleaning.rulesSubtitle', 'Schváleno všemi spolubydlícími') }}</span>
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300 pt-1">
        <div class="p-3.5 rounded-xl bg-slate-850 border border-slate-800 space-y-1">
          <div class="font-bold text-white flex items-center gap-1.5">
            <span>🛡️</span>
            <span>{{ t('cleaning.rulePermissionsTitle', 'Oprávnění a potvrzování') }}</span>
          </div>
          <p class="text-slate-400 leading-relaxed">
            {{ t('cleaning.rulePermissionsText', 'Každý spolubydlící smí označit jako hotovou výhradně') }} <strong>{{ t('cleaning.rulePermissionsStrong', 'svoji přidělenou povinnost') }}</strong>. {{ t('cleaning.rulePermissionsRest', 'Správce bytu má oprávnění potvrdit či zkontrolovat směnu kohokoli.') }}
          </p>
        </div>

        <div class="p-3.5 rounded-xl bg-slate-850 border border-slate-800 space-y-1">
          <div class="font-bold text-white flex items-center gap-1.5">
            <span>📅</span>
            <span>{{ t('cleaning.ruleWeeklyTitle', 'Týdenní periodicita') }}</span>
          </div>
          <p class="text-slate-400 leading-relaxed">
            {{ t('cleaning.ruleWeeklyText', 'Úklid každé zóny musí být dokončen do neděle 23:59 daného týdne. V pondělí 00:00 se povinnosti automaticky posouvají na dalšího spolubydlícího.') }}
          </p>
        </div>

        <div class="p-3.5 rounded-xl bg-slate-850 border border-slate-800 space-y-1">
          <div class="font-bold text-white flex items-center gap-1.5">
            <span>🧼</span>
            <span>{{ t('cleaning.ruleSuppliesTitle', 'Společné čistící pomůcky') }}</span>
          </div>
          <p class="text-slate-400 leading-relaxed">
            {{ t('cleaning.ruleSuppliesText', 'Pytle na odpadky, saponáty a tablety do myčky jsou hrazeny společně. V případě potřeby je přidejte do') }} <strong>{{ t('cleaning.ruleSuppliesStrong', 'Společného nákupního košíku') }}</strong>.
          </p>
        </div>
      </div>
    </div>

    <!-- Shift Swap Modal Dialog -->
    <div 
      v-if="isSwapModalOpen && shiftToSwap" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      @click.self="closeSwapModal"
    >
      <div
        ref="swapModalPanel"
        class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5 animate-in fade-in zoom-in duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="swap-modal-title"
        aria-describedby="swap-modal-description"
        tabindex="-1"

      >
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <div class="text-xs font-bold text-purple-400 mb-0.5">{{ t('cleaning.swapModalKicker', 'Převzetí úklidu') }}</div>
            <h3 id="swap-modal-title" class="text-lg font-bold text-white tracking-tight">
              {{ t('cleaning.swapModalTitle', 'Žádost o převzetí směny ⇄') }}
            </h3>
          </div>
          <button type="button"
            @click="closeSwapModal"
            class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40"
            :aria-label="t('cleaning.closeSwapDialog', 'Zavřít dialog převzetí směny')"
          >
            ✕
          </button>
        </div>

        <div id="swap-modal-description" class="p-3.5 rounded-xl bg-slate-850 border border-slate-800 text-xs space-y-1">
          <div class="text-slate-400">{{ t('cleaning.transferringShift', 'Převáděná směna:') }}</div>
          <div class="text-sm font-bold text-white flex items-center gap-2">
            <span>{{ t('cleaning.task.' + shiftToSwap.taskKey.toLowerCase(), shiftToSwap.taskTitle) }}</span>
            <span class="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">{{ formatCleaningWeek(shiftToSwap) }}</span>
          </div>
          <div class="text-slate-400 text-xs pt-1">
            {{ t('cleaning.currentAssignee', 'Současný řešitel:') }} <strong class="text-slate-200">{{ shiftToSwap.roommateName }}</strong>
          </div>
        </div>

        <div class="space-y-4 text-xs">
          <div>
            <label for="cleaningview-field-1" class="block text-slate-300 font-medium mb-1.5">
              {{ t('cleaning.pickTarget', 'Vyber spolubydlícího pro výměnu *') }}
            </label>
            <select id="cleaningview-field-1"
              v-model="selectedTargetRoommateId"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-purple-500/40 focus:outline-none"
            >
              <option 
                v-for="r in swapCandidates" 
                :key="r.id" 
                :value="r.id"
              >
                {{ r.name }} ({{ r.roomName }}, {{ t('roles.' + r.role, r.role) }})
              </option>
            </select>
          </div>

          <div>
            <label for="cleaningview-field-2" class="block text-slate-300 font-medium mb-1.5">
              {{ t('cleaning.reasonLabel', 'Důvod převzetí / zpráva pro spolubydlícího (volitelné)') }}
            </label>
            <input id="cleaningview-field-2"
              v-model="swapNote"
              type="text"
              :placeholder="t('cleaning.reasonPlaceholder', 'Např. Mám zkoušku / jedu domů na víkend...')"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-purple-500/40 focus:outline-none"
            />
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
          <button type="button"
            @click="closeSwapModal"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
          >
            {{ t('cleaning.cancel', 'Zrušit') }}
          </button>
          <button type="button"
            @click="submitSwap"
            :disabled="!selectedTargetRoommateId"
            class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-950/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{{ t('cleaning.sendSwapRequest', 'Odeslat žádost o převzetí') }}</span>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatCleaningWeek } from '../utils/localeDisplay'
import { formatDateCz } from '../utils/format'
import { useDialog } from '../composables/useDialog'
import { useSpolubyt } from '../composables/useSpolubyt'
import { CleaningShift, CleaningTaskKey } from '../types'
import { t } from '../i18n'

const {
  activeModal,
  selectedShift,
  openModal,
  closeModal,
  roommates,
  currentUser,
  isMasterTenant,
  cleaningShifts,
  cleaningTaskDefs,
  selectedCleaningWeek,
  currentWeekNumber,
  selectedWeekShifts,
  canConfirmShift,
  toggleShiftStatus,
  sendCleaningReminder,
  selectCleaningWeek,
  requestShiftSwap,
  acceptShiftSwap,
  rejectShiftSwap,
  cancelShiftSwap
} = useSpolubyt()

const isSwapModalOpen = computed(() => activeModal.value === 'SHIFT_SWAP')
const shiftToSwap = selectedShift
const selectedTargetRoommateId = ref<string>('')
const swapNote = ref<string>('')
const swapModalPanel = ref<HTMLElement | null>(null)

const swapCandidates = computed(() => {
  if (!shiftToSwap.value) return []
  return roommates.value.filter(r => r.id !== shiftToSwap.value?.roommateId)
})

const openSwapModal = (shift: CleaningShift) => {
  openModal('SHIFT_SWAP', shift)
  const candidates = roommates.value.filter(r => r.id !== shift.roommateId)
  selectedTargetRoommateId.value = candidates.length > 0 ? candidates[0].id : ''
  swapNote.value = ''

}

const closeSwapModal = (): void => {
  closeModal()
  swapNote.value = ''
}

useDialog(swapModalPanel, closeSwapModal, isSwapModalOpen)

const submitSwap = () => {
  if (!shiftToSwap.value || !selectedTargetRoommateId.value) return
  requestShiftSwap(shiftToSwap.value.id, selectedTargetRoommateId.value, swapNote.value)
  closeSwapModal()
}

const canCancelSwap = (shift?: CleaningShift): boolean => {
  if (!shift || !shift.swapRequest || shift.swapRequest.status !== 'PENDING') return false
  return isMasterTenant.value || currentUser.value.id === shift.swapRequest.requestedByRoommateId
}

const isSwapRecipient = (shift?: CleaningShift): boolean => {
  if (!shift || !shift.swapRequest || shift.swapRequest.status !== 'PENDING') return false
  return currentUser.value.id === shift.swapRequest.targetRoommateId
}

const pendingIncomingSwaps = computed(() => {
  return cleaningShifts.value.filter(s => 
    s.swapRequest?.status === 'PENDING' && 
    s.swapRequest?.targetRoommateId === currentUser.value.id
  )
})

const activeShifts = computed(() => selectedWeekShifts.value)

const completedCount = computed(() => {
  return activeShifts.value.filter(s => s.isCompleted).length
})

const progressPct = computed(() => {
  if (activeShifts.value.length === 0) return 0
  return Math.round((completedCount.value / activeShifts.value.length) * 100)
})

const currentWeekLabel = computed(() => {
  const first = activeShifts.value[0]
  if (first) return formatCleaningWeek(first)
  return t('cleaning.weekNumber', 'Týden {week}', { week: selectedCleaningWeek.value })
})

const getShiftForTask = (key: CleaningTaskKey): CleaningShift | undefined => {
  return activeShifts.value.find(s => s.taskKey === key)
}

const getRoommate = (id?: string) => {
  if (!id) return undefined
  return roommates.value.find(r => r.id === id)
}

const isMyShift = (shift?: CleaningShift): boolean => {
  if (!shift) return false
  return shift.roommateId === currentUser.value.id
}

const canUserConfirm = (shift?: CleaningShift): boolean => {
  if (!shift) return false
  return canConfirmShift(shift)
}

const handleConfirmShift = (shift: CleaningShift) => {
  toggleShiftStatus(shift.id)
}

const getTitleColor = (key: CleaningTaskKey) => {
  switch (key) {
    case 'KITCHEN': return 'text-emerald-400'
    case 'BATHROOM': return 'text-sky-400'
    case 'CORRIDOR': return 'text-amber-400'
    case 'TRASH': return 'text-purple-400'
  }
}

const getIconBg = (key: CleaningTaskKey) => {
  switch (key) {
    case 'KITCHEN': return 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
    case 'BATHROOM': return 'bg-sky-500/15 border border-sky-500/30 text-sky-400'
    case 'CORRIDOR': return 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
    case 'TRASH': return 'bg-purple-500/15 border border-purple-500/30 text-purple-400'
  }
}

// 4-Week Rotation Matrix Data
const rotationWeeks = computed(() => [45, 46, 47, 48].map(number => ({
  number,
  label: t('cleaning.weekNumber', 'Týden {week}', { week: number }),
  dates: (() => {
    const shift = cleaningShifts.value.find(s => s.weekNumber === number)
    return shift ? `${formatDateCz(shift.startDate, 'none')} – ${formatDateCz(shift.endDate)}` : ''
  })(),
})))

const assignedRoommate = (taskKey: CleaningTaskKey, weekNum: number) => {
  const shift = cleaningShifts.value.find(s => s.weekNumber === weekNum && s.taskKey === taskKey)
  return roommates.value.find(r => r.id === shift?.roommateId)
}
</script>
