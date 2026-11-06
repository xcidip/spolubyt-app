<template>
  <div class="space-y-6">
    
    <!-- Top Header & Role Indicator -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
      <div>
        <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-1" :class="isMasterTenant ? 'text-emerald-400' : 'text-sky-400'">
          <span class="w-2 h-2 rounded-full animate-pulse" :class="isMasterTenant ? 'bg-emerald-500' : 'bg-sky-500'"></span>
          <span>{{ isMasterTenant ? 'Správa úklidových směn (Správce bytu)' : `Úklidové směny spolubydlícího (${currentUser.role})` }}</span>
        </div>
        <h1 class="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <span>Úklidové směny a rotace</span>
          <span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold font-mono">
            4 zóny • 4 spolubydlící
          </span>
        </h1>
        <p class="text-xs text-slate-400 mt-1">
          Férová týdenní rotace povinností ve společných prostorách. Každá akce se dokončuje týdně a role se postupně střídají.
        </p>
      </div>

      <!-- Quick Persona Switcher for easy testing of permissions -->
      <div class="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col gap-1.5 shrink-0">
        <div class="text-[11px] font-semibold text-slate-400 flex items-center justify-between gap-2">
          <span>Aktivní spolubydlící (testování práv):</span>
          <span class="text-emerald-400 font-mono text-[10px]">{{ currentUser.role }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <button
            v-for="r in roommates"
            :key="r.id"
            @click="setCurrentUser(r.id)"
            class="px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
            :class="[
              currentUser.id === r.id 
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-950/50 scale-102' 
                : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-750'
            ]"
            :title="`Přepnout na ${r.name} (${r.role})`"
          >
            <span class="w-2 h-2 rounded-full" :class="r.role === 'Správce' ? 'bg-amber-400' : 'bg-sky-400'"></span>
            <span>{{ r.name.split(' ')[0] }}</span>
            <span v-if="r.role === 'Správce'" class="text-[10px] opacity-75">👑</span>
          </button>
        </div>
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
        <div class="font-bold uppercase tracking-wider text-[11px]">
          {{ isMasterTenant ? 'Oprávnění správce bytu (Plný přístup)' : 'Oprávnění člena bytu (Omezený přístup)' }}
        </div>
        <p v-if="isMasterTenant" class="text-slate-300">
          Jste přihlášen jako <strong>{{ currentUser.name }} (Správce bytu)</strong>. Můžete potvrdit, schválit nebo zrušit 
          <strong>libovolnou úklidovou směnu</strong> kteréhokoli spolubydlícího.
        </p>
        <p v-else class="text-slate-300">
          Jste přihlášen jako <strong>{{ currentUser.name }} (Člen)</strong>. Podle domovního řádu máte oprávnění 
          <strong>potvrdit pouze svoji vlastní směnu</strong>. U směn ostatních spolubydlících je potvrzení uzamčeno (můžete jim pouze poslat připomínku).
        </p>
      </div>
    </div>

    <!-- Week Navigator & Progress -->
    <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <!-- Week Controls -->
        <div class="flex items-center gap-2">
          <button
            @click="selectCleaningWeek(selectedCleaningWeek - 1)"
            class="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors"
            title="Předchozí týden"
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
              class="text-[11px] font-semibold px-2 py-0.5 rounded-md border"
              :class="[
                selectedCleaningWeek === currentWeekNumber 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                  : selectedCleaningWeek < currentWeekNumber 
                    ? 'bg-slate-800 text-slate-400 border-slate-700' 
                    : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
              ]"
            >
              {{ selectedCleaningWeek === currentWeekNumber ? 'Aktuální týden' : (selectedCleaningWeek < currentWeekNumber ? 'Minulý týden' : 'Budoucí rozpis') }}
            </span>
          </div>

          <button
            @click="selectCleaningWeek(selectedCleaningWeek + 1)"
            class="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors"
            title="Další týden"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            v-if="selectedCleaningWeek !== currentWeekNumber"
            @click="selectCleaningWeek(currentWeekNumber)"
            class="text-xs px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-slate-700 font-medium transition-colors ml-1"
          >
            Dnes / Tento týden
          </button>
        </div>

        <!-- Weekly Progress Stats -->
        <div class="flex items-center gap-3">
          <div class="text-right">
            <div class="text-xs font-semibold text-slate-300">
              Splněno: <span class="text-white font-mono font-bold">{{ completedCount }}/{{ activeShifts.length }}</span> směn
            </div>
            <div class="text-[11px] text-slate-400">
              {{ completedCount === activeShifts.length ? 'Všechny zóny uklizeny 👏' : `${activeShifts.length - completedCount} zóny zbývají uklidit` }}
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
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div 
        v-for="taskDef in cleaningTaskDefs"
        :key="taskDef.key"
        class="rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-lg relative"
        :class="[
          getShiftForTask(taskDef.key)?.isCompleted 
            ? 'bg-slate-900/90 border-emerald-500/30' 
            : isMyShift(getShiftForTask(taskDef.key))
              ? 'bg-slate-900 border-amber-500/40 ring-1 ring-amber-500/30'
              : 'bg-slate-900 border-slate-800'
        ]"
      >
        <!-- Top Card Header -->
        <div class="p-5 pb-4 border-b border-slate-800/80">
          <div class="flex items-start justify-between gap-3">
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
                <div class="text-[11px] uppercase tracking-wider font-bold" :class="getTitleColor(taskDef.key)">
                  {{ taskDef.shortTitle }}
                </div>
                <h3 class="text-base font-bold text-white tracking-tight truncate">
                  {{ taskDef.title }}
                </h3>
              </div>
            </div>

            <!-- Status Pill -->
            <div class="shrink-0">
              <span 
                v-if="getShiftForTask(taskDef.key)?.isCompleted"
                class="text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
                <span>Splněno</span>
              </span>
              <span 
                v-else
                class="text-xs px-2.5 py-1 rounded-full font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/25 flex items-center gap-1.5"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                <span>Čeká na splnění</span>
              </span>
            </div>
          </div>

          <!-- Description -->
          <p class="text-xs text-slate-400 mt-2.5 leading-relaxed">
            {{ taskDef.description }}
          </p>
        </div>

        <!-- Middle Card: Assigned Flatmate & Subtasks -->
        <div class="p-5 space-y-4 flex-1">
          <!-- Roommate Assignment Box -->
          <div 
            class="p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors"
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
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-white truncate">
                    {{ getShiftForTask(taskDef.key)?.roommateName }}
                  </span>
                  <span 
                    v-if="isMyShift(getShiftForTask(taskDef.key))"
                    class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-slate-950 uppercase tracking-wider"
                  >
                    Moje směna
                  </span>
                </div>
                <div class="text-[11px] text-slate-400">
                  {{ getRoommate(getShiftForTask(taskDef.key)?.roommateId)?.roomName }} • 
                  {{ getRoommate(getShiftForTask(taskDef.key)?.roommateId)?.role }}
                </div>
              </div>
            </div>

            <!-- Due date / Done timestamp -->
            <div class="text-right shrink-0">
              <div v-if="getShiftForTask(taskDef.key)?.isCompleted" class="text-[11px] text-emerald-400 font-mono">
                {{ getShiftForTask(taskDef.key)?.completedAt }}
              </div>
              <div v-else class="text-[11px] text-slate-400">
                Termín: <strong class="text-slate-300">Do neděle</strong>
              </div>
            </div>
          </div>

          <!-- Subtasks Checklist -->
          <div class="space-y-1.5 pt-1">
            <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Doporučený kontrolní seznam:
            </div>
            <ul class="space-y-1 text-xs text-slate-300">
              <li 
                v-for="(subtask, idx) in taskDef.subtasks" 
                :key="idx"
                class="flex items-start gap-2 py-0.5"
              >
                <svg 
                  class="w-4 h-4 mt-0.5 shrink-0" 
                  :class="getShiftForTask(taskDef.key)?.isCompleted ? 'text-emerald-400' : 'text-slate-500'" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ subtask }}</span>
              </li>
            </ul>
          </div>

          <!-- Completed by audit if done -->
          <div 
            v-if="getShiftForTask(taskDef.key)?.isCompleted"
            class="text-[11px] text-slate-400 bg-slate-850 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between"
          >
            <span>Potvrdil(a): <strong class="text-slate-200">{{ getShiftForTask(taskDef.key)?.completedBy }}</strong></span>
            <span v-if="getShiftForTask(taskDef.key)?.notes" class="text-slate-400 italic">"{{ getShiftForTask(taskDef.key)?.notes }}"</span>
          </div>
        </div>

        <!-- Card Footer: Actions with strict permission control -->
        <div class="p-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between gap-3">
          
          <!-- Case 1: Current user HAS permission (is the assigned flatmate OR is Správce) -->
          <template v-if="canUserConfirm(getShiftForTask(taskDef.key))">
            
            <!-- Not completed: Primary Confirm Button -->
            <button
              v-if="!getShiftForTask(taskDef.key)?.isCompleted"
              @click="handleConfirmShift(getShiftForTask(taskDef.key)!)"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all hover:scale-101"
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
                {{ isMyShift(getShiftForTask(taskDef.key)) ? 'Potvrdit hotový úklid' : `Potvrdit za spolubydlícího (Správce)` }}
              </span>
            </button>

            <!-- Completed: Revert Button -->
            <button
              v-else
              @click="handleConfirmShift(getShiftForTask(taskDef.key)!)"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Zrušit potvrzení (vrátit zpět)</span>
            </button>

          </template>

          <!-- Case 2: Current user DOES NOT have permission (foreign duty, not Správce) -->
          <template v-else>
            <div class="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <!-- Disabled Locked Button -->
              <button
                disabled
                class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-800/40 text-slate-500 text-xs font-medium border border-slate-800 cursor-not-allowed"
                :title="`Tuto směnu smí potvrdit pouze ${getShiftForTask(taskDef.key)?.roommateName} nebo správce bytu.`"
              >
                <svg class="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Uzamčeno (pouze pro {{ getShiftForTask(taskDef.key)?.roommateName.split(' ')[0] }})</span>
              </button>

              <!-- Reminder Button if not completed -->
              <button
                v-if="!getShiftForTask(taskDef.key)?.isCompleted"
                @click="sendCleaningReminder(getShiftForTask(taskDef.key)!.id)"
                class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-sky-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-1.5 shrink-0"
                title="Poslat spolubydlícímu přátelské upozornění na blížící se termín"
              >
                <svg class="w-3.5 h-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span>Připomenout</span>
              </button>
            </div>
          </template>

        </div>
      </div>
    </div>

    <!-- 4-Week Rotation Matrix / Harmonogram -->
    <div class="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div>
          <h2 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>Harmonogram rotace na 4 týdny</span>
            <span class="text-xs text-emerald-400 font-normal">Posun každé pondělí o 1 zónu</span>
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">
            Přehled toho, kdo má jakou povinnost v jednotlivých týdnech. Všichni spolubydlící tak vystřídají každou zónu právě jednou za měsíc.
          </p>
        </div>
      </div>

      <!-- Rotation Matrix Table -->
      <div class="border border-slate-800 rounded-xl overflow-x-auto bg-slate-850">
        <table class="w-full text-left text-xs whitespace-nowrap">
          <thead class="bg-slate-800/80 text-slate-300 border-b border-slate-700">
            <tr>
              <th class="p-3.5 font-bold">Úklidová zóna</th>
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
                    class="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  >
                    Dnes
                  </span>
                </div>
                <div class="text-[10px] text-slate-400 font-normal">{{ w.dates }}</div>
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
                    <div>{{ task.title }}</div>
                    <div class="text-[10px] text-slate-400">{{ task.shortTitle }}</div>
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
                    getAssignedRoommateFor(task.key, w.number)?.id === currentUser.id
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-200 font-bold'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
                  ]"
                >
                  <div 
                    class="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                    :class="getAssignedRoommateFor(task.key, w.number)?.avatarColor || 'bg-slate-700'"
                  >
                    {{ getAssignedRoommateFor(task.key, w.number)?.avatarInitial }}
                  </div>
                  <span>{{ getAssignedRoommateFor(task.key, w.number)?.name.split(' ')[0] }}</span>
                  <span 
                    v-if="getAssignedRoommateFor(task.key, w.number)?.id === currentUser.id"
                    class="text-[9px] bg-amber-500 text-slate-950 px-1 rounded font-extrabold uppercase"
                  >
                    Ty
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
      <h2 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
        <span>Domovní dohoda a pravidla úklidu</span>
        <span class="text-xs text-slate-400 font-normal">Schváleno všemi spolubydlícími</span>
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300 pt-1">
        <div class="p-3.5 rounded-xl bg-slate-850 border border-slate-800 space-y-1">
          <div class="font-bold text-white flex items-center gap-1.5">
            <span>🛡️</span>
            <span>Oprávnění a potvrzování</span>
          </div>
          <p class="text-slate-400 leading-relaxed">
            Každý spolubydlící smí označit jako hotovou výhradně <strong>svoji přidělenou povinnost</strong>. Správce bytu má oprávnění potvrdit či zkontrolovat směnu kohokoli.
          </p>
        </div>

        <div class="p-3.5 rounded-xl bg-slate-850 border border-slate-800 space-y-1">
          <div class="font-bold text-white flex items-center gap-1.5">
            <span>📅</span>
            <span>Týdenní periodicita</span>
          </div>
          <p class="text-slate-400 leading-relaxed">
            Úklid každé zóny musí být dokončen do neděle 23:59 daného týdne. V pondělí 00:00 se povinnosti automaticky posouvají na dalšího spolubydlícího.
          </p>
        </div>

        <div class="p-3.5 rounded-xl bg-slate-850 border border-slate-800 space-y-1">
          <div class="font-bold text-white flex items-center gap-1.5">
            <span>🧼</span>
            <span>Společné čistící pomůcky</span>
          </div>
          <p class="text-slate-400 leading-relaxed">
            Pytle na odpadky, saponáty a tablety do myčky jsou hrazeny společně. V případě potřeby je přidejte do <strong>Společného nákupního košíku</strong>.
          </p>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSpolubyt } from '../composables/useSpolubyt'
import { CleaningShift, CleaningTaskKey } from '../types'

const {
  roommates,
  currentUser,
  isMasterTenant,
  setCurrentUser,
  cleaningTaskDefs,
  selectedCleaningWeek,
  currentWeekNumber,
  selectedWeekShifts,
  canConfirmShift,
  toggleShiftStatus,
  sendCleaningReminder,
  selectCleaningWeek
} = useSpolubyt()

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
  if (first) return first.weekLabel
  return `Týden ${selectedCleaningWeek.value}`
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
const rotationWeeks = computed(() => [
  { number: 45, label: 'Týden 45', dates: '2. 11. – 8. 11.' },
  { number: 46, label: 'Týden 46', dates: '9. 11. – 15. 11.' },
  { number: 47, label: 'Týden 47', dates: '16. 11. – 22. 11.' },
  { number: 48, label: 'Týden 48', dates: '23. 11. – 29. 11.' }
])

const taskOrderMap: Record<CleaningTaskKey, number> = {
  KITCHEN: 0,
  BATHROOM: 1,
  CORRIDOR: 2,
  TRASH: 3
}

const getAssignedRoommateFor = (taskKey: CleaningTaskKey, weekNum: number) => {
  const taskIdx = taskOrderMap[taskKey]
  const diff = weekNum - 45
  const rmIdx = ((taskIdx + (diff % 4)) % 4 + 4) % 4
  return roommates.value[rmIdx] || roommates.value[0]
}
</script>

