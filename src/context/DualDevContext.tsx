import React, { createContext, useContext, useState, useEffect } from 'react';
// Tipos TypeScript principais para lições, trilhas, missões diárias e conquistas
import { TrackId, Lesson, Mission, Achievement } from '../types';
// Base de dados com as aulas de todas as trilhas
import { allLessons, getLessonsByTrack } from '../data/lessons';
import { tracks } from '../data/tracks';
// Metadados iniciais de missões diárias e conquistas desbloqueáveis
import { initialMissions } from '../data/missions';
import { initialAchievements } from '../data/achievements';

// Define os dois temas possíveis da aplicação (escuro e claro)
export type ThemeMode = 'dark' | 'light';

/**
 * Interface que documenta todas as variáveis e métodos disponíveis globalmente no DualDevContext
 */
interface DualDevContextType {
  // Controle de tema (dark / light)
  theme: ThemeMode;
  toggleTheme: () => void;
  // Controle da página/aba ativa na barra de navegação superior
  activeTab: 'inicio' | 'academia' | 'playground' | 'conquistas' | 'sobre';
  setActiveTab: (tab: 'inicio' | 'academia' | 'playground' | 'conquistas' | 'sobre') => void;
  // Trilha ativa selecionada (ex: 'java', 'python', 'javascript')
  currentTrackId: TrackId;
  setCurrentTrackId: (id: TrackId) => void;
  // ID da lição aberta no momento
  currentLessonId: string;
  setCurrentLessonId: (id: string) => void;
  // Objeto completo com dados da lição em foco
  currentLesson: Lesson;
  // Gamificação: pontos de experiência, nível calculado e dias de sequência
  userXp: number;
  userLevel: number;
  streak: number;
  // Lista de lições que já foram concluídas
  completedLessonIds: string[];
  // Rascunhos de código do usuário salvos por lição
  codeDrafts: Record<string, string>;
  saveDraft: (lessonId: string, code: string) => void;
  resetDraft: (lessonId: string) => void;
  // Conclui uma lição, atribui XP e checa desbloqueio de insígnias
  completeLesson: (lessonId: string) => void;
  // Missões diárias com progresso do usuário
  missions: Mission[];
  // Conquistas/insígnias do usuário
  achievements: Achievement[];
  // Registra que um código foi executado (avança missões diárias)
  recordCodeExecution: (trackId: TrackId) => void;
  // Funções de navegação rápida entre aulas
  nextLesson: () => void;
  prevLesson: () => void;
}

// Criação do Contexto React
const DualDevContext = createContext<DualDevContextType | undefined>(undefined);

/**
 * Função utilitária para recuperar dados JSON do LocalStorage com segurança
 * Retorna o valor de fallback caso o LocalStorage esteja indisponível ou corrompido
 */
function getSafeItem<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    return JSON.parse(saved) as T;
  } catch {
    return fallback;
  }
}

/**
 * Função utilitária para recuperar números do LocalStorage com segurança
 */
function getSafeNumber(key: string, fallback: number): number {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const n = parseInt(saved, 10);
    return isNaN(n) ? fallback : n;
  } catch {
    return fallback;
  }
}

/**
 * DualDevProvider: Componente Provedor que encapsula a aplicação e fornece
 * todo o estado global persistente (XP, progresso, rascunhos, tema, lições).
 */
export const DualDevProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Estado do Tema (Dark ou Light), persistido no navegador
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('dualdev_theme');
      return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    } catch {
      return 'dark';
    }
  });

  // 2. Navegação entre abas principais
  const [activeTab, setActiveTab] = useState<'inicio' | 'academia' | 'playground' | 'conquistas' | 'sobre'>('academia');
  
  // 3. Trilha e Lição selecionadas
  const [currentTrackId, setCurrentTrackId] = useState<TrackId>('java');
  const [currentLessonId, setCurrentLessonId] = useState<string>('java-class-main');

  // 4. Estados de Gamificação e Persistência do Usuário
  const [userXp, setUserXp] = useState<number>(() => getSafeNumber('dualdev_xp', 120));
  const [streak, setStreak] = useState<number>(() => getSafeNumber('dualdev_streak', 3));
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(() => 
    getSafeItem<string[]>('dualdev_completed_lessons', ['java-intro'])
  );
  const [codeDrafts, setCodeDrafts] = useState<Record<string, string>>(() => 
    getSafeItem<Record<string, string>>('dualdev_drafts', {})
  );
  const [missions, setMissions] = useState<Mission[]>(() => 
    getSafeItem<Mission[]>('dualdev_missions', initialMissions)
  );
  const [achievements, setAchievements] = useState<Achievement[]>(() => 
    getSafeItem<Achievement[]>('dualdev_achievements', initialAchievements)
  );

  // Calcula qual é o objeto completo da lição em foco
  const currentLessons = getLessonsByTrack(currentTrackId);
  const currentLesson =
    allLessons.find((l) => l.id === currentLessonId) ||
    currentLessons[0] ||
    allLessons[0];

  // Cálculo de nível do desenvolvedor: cada 150 XP avança 1 nível (Nv 1, Nv 2, Nv 3...)
  const userLevel = Math.floor(userXp / 150) + 1;

  /**
   * Grava valores no LocalStorage com tratamento de exceção
   */
  function setSafeItem(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignora falhas de gravação (ex: modo anônimo restrito)
    }
  }

  // Sincroniza a classe 'dark' na tag <html> e salva o tema
  useEffect(() => {
    setSafeItem('dualdev_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Alternador de tema claro/escuro
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Efeitos para persistir o progresso do usuário no LocalStorage
  useEffect(() => {
    setSafeItem('dualdev_xp', String(userXp));
  }, [userXp]);

  useEffect(() => {
    setSafeItem('dualdev_streak', String(streak));
  }, [streak]);

  useEffect(() => {
    setSafeItem('dualdev_completed_lessons', JSON.stringify(completedLessonIds));
  }, [completedLessonIds]);

  useEffect(() => {
    setSafeItem('dualdev_drafts', JSON.stringify(codeDrafts));
  }, [codeDrafts]);

  useEffect(() => {
    setSafeItem('dualdev_missions', JSON.stringify(missions));
  }, [missions]);

  useEffect(() => {
    setSafeItem('dualdev_achievements', JSON.stringify(achievements));
  }, [achievements]);

  /**
   * Troca de trilha (ex: Java para Python):
   * Encontra a primeira lição incompleta da trilha para guiar o estudante.
   */
  const handleSetTrack = (trackId: TrackId) => {
    setCurrentTrackId(trackId);
    const trackLessons = getLessonsByTrack(trackId);
    if (trackLessons.length > 0) {
      const nextIncomplete = trackLessons.find((l) => !completedLessonIds.includes(l.id));
      setCurrentLessonId(nextIncomplete ? nextIncomplete.id : trackLessons[0].id);
    }
  };

  /**
   * Salva o código digitado pelo usuário como rascunho daquela lição específica
   */
  const saveDraft = (lessonId: string, code: string) => {
    setCodeDrafts((prev) => ({ ...prev, [lessonId]: code }));
  };

  /**
   * Remove o rascunho de uma lição e força a volta para o template original
   */
  const resetDraft = (lessonId: string) => {
    const lesson = allLessons.find((l) => l.id === lessonId);
    if (lesson) {
      setCodeDrafts((prev) => {
        const next = { ...prev };
        delete next[lessonId];
        return next;
      });
    }
  };

  /**
   * Marca uma lição como concluída com sucesso:
   * Concede os pontos de XP da lição, desbloqueia conquistas relacionadas e atualiza missões.
   */
  const completeLesson = (lessonId: string) => {
    const lesson = allLessons.find((l) => l.id === lessonId);
    if (!lesson) return;

    if (!completedLessonIds.includes(lessonId)) {
      setCompletedLessonIds((prev) => [...prev, lessonId]);
      setUserXp((prev) => prev + lesson.xp);

      // Verificação de conquistas específicas da trilha Java
      if (lessonId === 'java-class-main') {
        unlockAchievement('ach-java-main');
      } else if (lessonId === 'java-methods-params') {
        unlockAchievement('ach-java-methods');
      } else if (lessonId === 'java-arrays-strings') {
        unlockAchievement('ach-java-arrays');
      }

      // Atualiza a missão diária de completar lições
      updateMissionProgress('complete_lesson', 1);
    }
  };

  /**
   * Desbloqueia uma conquista/insígnia e bonifica o usuário com XP extra
   */
  const unlockAchievement = (achId: string) => {
    setAchievements((prev) =>
      prev.map((ach) => {
        if (ach.id === achId && !ach.unlockedAt) {
          setUserXp((xp) => xp + ach.xpReward);
          return { ...ach, unlockedAt: new Date().toISOString() };
        }
        return ach;
      })
    );
  };

  /**
   * Incrementa o progresso de uma missão diária específica (ex: rodar código, completar lição)
   */
  const updateMissionProgress = (type: Mission['type'], delta: number) => {
    setMissions((prev) =>
      prev.map((m) => {
        if (m.type === type && !m.completed) {
          const newProgress = Math.min(m.target, m.progress + delta);
          const isDone = newProgress >= m.target;
          if (isDone && !m.completed) {
            setUserXp((xp) => xp + m.xpReward);
          }
          return { ...m, progress: newProgress, completed: isDone };
        }
        return m;
      })
    );
  };

  /**
   * Registra a execução de código para liberar a conquista do primeiro passo e avançar missões
   */
  const recordCodeExecution = (trackId: TrackId) => {
    unlockAchievement('ach-first-step');
    updateMissionProgress('run_code', 1);
    if (trackId === 'java') {
      updateMissionProgress('java_exercise', 1);
    }
  };

  /**
   * Navega para a próxima lição da trilha ativa
   */
  const nextLesson = () => {
    const list = getLessonsByTrack(currentTrackId);
    const currentIndex = list.findIndex((l) => l.id === currentLessonId);
    if (currentIndex >= 0 && currentIndex < list.length - 1) {
      setCurrentLessonId(list[currentIndex + 1].id);
    }
  };

  /**
   * Volta para a lição anterior da trilha ativa
   */
  const prevLesson = () => {
    const list = getLessonsByTrack(currentTrackId);
    const currentIndex = list.findIndex((l) => l.id === currentLessonId);
    if (currentIndex > 0) {
      setCurrentLessonId(list[currentIndex - 1].id);
    }
  };

  return (
    <DualDevContext.Provider
      value={{
        theme,
        toggleTheme,
        activeTab,
        setActiveTab,
        currentTrackId,
        setCurrentTrackId: handleSetTrack,
        currentLessonId,
        setCurrentLessonId,
        currentLesson,
        userXp,
        userLevel,
        streak,
        completedLessonIds,
        codeDrafts,
        saveDraft,
        resetDraft,
        completeLesson,
        missions,
        achievements,
        recordCodeExecution,
        nextLesson,
        prevLesson,
      }}
    >
      {children}
    </DualDevContext.Provider>
  );
};

/**
 * Hook customizado useDualDev: permite a qualquer componente da aplicação
 * acessar facilmente os estados e métodos do DualDevContext sem complexidade.
 */
export function useDualDev() {
  const context = useContext(DualDevContext);
  if (!context) {
    throw new Error('useDualDev deve ser utilizado dentro de um DualDevProvider');
  }
  return context;
}
