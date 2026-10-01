import React, { useState, useEffect } from 'react';
// Contexto global da aplicação: gerencia trilhas, lições, pontuação de XP, streaks e estado salvo
import { useDualDev } from '../context/DualDevContext';
// Dados estáticos: catálogo de trilhas (Java, Python, JS, HTML, CSS) e busca de lições
import { tracks } from '../data/tracks';
import { getLessonsByTrack } from '../data/lessons';
// Runner de código: interpretador embutido no navegador para simular a execução de código
import { executeCode } from '../services/runners';
// Componentes visuais do workspace de aprendizado
import { CodeEditor } from '../components/CodeEditor';
import { ConsoleOutput } from '../components/ConsoleOutput';
import { TheoryPanel } from '../components/TheoryPanel';
// Tipagens TypeScript para segurança e autocompletar de resultados de execução e testes
import { ExecutionResult, TestResult } from '../types';
import { LanguageIcon } from '../components/LanguageIcon';
// Ícones visuais da biblioteca lucide-react
import { 
  CheckCircle2, 
  Circle, 
  Menu, 
  X 
} from 'lucide-react';

/**
 * AcademiaPage: Página principal de aprendizado interativo do DualDev.
 * Reúne o índice de exercícios (sidebar retrátil), a teoria/desafio, o editor de código com IntelliSense e o console de saída/testes.
 */
export const AcademiaPage: React.FC = () => {
  // Extração de funções e estados do contexto global DualDevContext
  const {
    currentTrackId,      // ID da trilha selecionada (ex: 'java', 'python', 'javascript')
    setCurrentTrackId,   // Função para mudar a trilha ativa
    currentLessonId,     // ID da lição que o usuário está praticando no momento
    setCurrentLessonId,  // Função para carregar outra lição
    currentLesson,       // Objeto completo com título, teoria, código inicial e testes da lição atual
    completedLessonIds,  // Lista de IDs das lições que o usuário já concluiu com êxito
    codeDrafts,          // Rascunhos de código do usuário salvos no LocalStorage
    saveDraft,           // Função para persistir alterações de código automaticamente
    resetDraft,          // Função para resetar o código para o template original da aula
    completeLesson,      // Função que marca a lição como feita, atribui XP e checa conquistas
    recordCodeExecution, // Função que atualiza o contador de execuções para missões diárias
    nextLesson,          // Atalho para ir para a próxima lição da trilha
    prevLesson,          // Atalho para voltar à lição anterior
  } = useDualDev();

  // Lista de lições da trilha atual e os metadados da trilha ativa
  const trackLessons = getLessonsByTrack(currentTrackId);
  const currentTrack = tracks.find((t) => t.id === currentTrackId) || tracks[0];

  // --- Estados Locais do Editor e Console ---
  // editorCode: armazena o texto atual digitado no editor de código
  const [editorCode, setEditorCode] = useState<string>('');
  // executionResult: armazena a saída (stdout, stderr, tempo em ms) gerada após clicar em "Executar"
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  // testResults: lista com os resultados de cada teste automatizado do desafio
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  // isRunning: indica se o código está sendo compilado/interpretado no momento (mostra loader)
  const [isRunning, setIsRunning] = useState(false);
  // isTesting: indica se a verificação dos testes automatizados está em andamento
  const [isTesting, setIsTesting] = useState(false);
  // activeConsoleTab: controla qual aba do console está ativa ('output' = terminal, 'tests' = testes)
  const [activeConsoleTab, setActiveConsoleTab] = useState<'output' | 'tests'>('output');
  // isSidebarOpen: controla se a aba lateral com a lista de lições/exercícios está visível ou fechada (tela cheia)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1280; // Aberto por padrão em telas grandes, fechado em telas menores
    }
    return false;
  });

  /**
   * Efeito disparado sempre que o usuário muda de lição:
   * Carrega o rascunho salvo anteriormente ou o código inicial da nova lição e limpa o terminal.
   */
  useEffect(() => {
    if (currentLesson) {
      const savedCode = codeDrafts[currentLesson.id];
      setEditorCode(savedCode !== undefined ? savedCode : currentLesson.initialCode);
      setExecutionResult(null);
      setTestResults([]);
      setActiveConsoleTab('output');
    }
  }, [currentLesson?.id]);

  /**
   * handleCodeChange: Chamado a cada caractere digitado no editor de código.
   * Atualiza o estado local e persiste o rascunho no LocalStorage para evitar perda de dados.
   */
  const handleCodeChange = (newCode: string) => {
    setEditorCode(newCode);
    if (currentLesson) {
      saveDraft(currentLesson.id, newCode);
    }
  };

  /**
   * handleRunCode: Executa o código atual sem validar os testes, apenas para ver a saída no terminal.
   */
  const handleRunCode = async () => {
    if (!currentLesson) return;
    setIsRunning(true);
    setActiveConsoleTab('output'); // Foca automaticamente na aba do terminal

    try {
      const res = await executeCode(currentTrackId, editorCode);
      setExecutionResult(res);
      recordCodeExecution(currentTrackId); // Registra a execução para missões diárias
    } catch (err: any) {
      setExecutionResult({
        stdout: '',
        stderr: err.message || 'Erro inesperado na execução.',
        executionTimeMs: 0,
      });
    } finally {
      setIsRunning(false);
    }
  };

  /**
   * handleTestChallenge: Executa o código e valida contra todos os casos de teste da lição.
   * Se todos os testes passarem, a lição é concluída e o usuário ganha XP e sobe de nível.
   */
  const handleTestChallenge = async () => {
    if (!currentLesson) return;
    setIsTesting(true);

    try {
      // 1. Executa o código para capturar a saída de texto
      const execRes = await executeCode(currentTrackId, editorCode);
      setExecutionResult(execRes);
      recordCodeExecution(currentTrackId);

      // 2. Valida cada caso de teste da lição
      const results: TestResult[] = currentLesson.testCases.map((tc) => {
        if (tc.validator) {
          const outcome = tc.validator(editorCode, execRes.stdout);
          return {
            testId: tc.id,
            description: tc.description,
            passed: outcome.passed,
            message: outcome.message,
          };
        }

        // Validação padrão caso o teste não tenha validator customizado
        const passed = !execRes.stderr && execRes.stdout.trim().length > 0;
        return {
          testId: tc.id,
          description: tc.description,
          passed,
          message: passed ? 'Código executado com sucesso!' : 'Código falhou na execução.',
        };
      });

      setTestResults(results);
      setActiveConsoleTab('tests'); // Muda para a aba de testes para exibir os resultados

      // 3. Se todos os testes passarem, marca a lição como concluída e concede XP
      const allPassed = results.length > 0 && results.every((r) => r.passed);
      if (allPassed) {
        completeLesson(currentLesson.id);
      }
    } catch (err: any) {
      setExecutionResult({
        stdout: '',
        stderr: err.message || 'Erro na avaliação do código.',
        executionTimeMs: 0,
      });
    } finally {
      setIsTesting(false);
    }
  };

  /**
   * handleResetCode: Restaura o código do editor para o template inicial da aula.
   */
  const handleResetCode = () => {
    if (!currentLesson) return;
    setEditorCode(currentLesson.initialCode);
    resetDraft(currentLesson.id);
    setExecutionResult(null);
    setTestResults([]);
  };

  /**
   * handleLoadSolution: Preenche o editor com o código da solução recomendada da lição.
   */
  const handleLoadSolution = () => {
    if (!currentLesson) return;
    setEditorCode(currentLesson.solutionCode);
    saveDraft(currentLesson.id, currentLesson.solutionCode);
  };

  // Cálculos de progresso da trilha
  const completedCount = trackLessons.filter((l) => completedLessonIds.includes(l.id)).length;
  const progressPercent = trackLessons.length > 0 ? Math.round((completedCount / trackLessons.length) * 100) : 0;

  // Índices para navegação de lições anterior e próxima
  const currentLessonIndex = trackLessons.findIndex((l) => l.id === currentLesson?.id);
  const hasNext = currentLessonIndex >= 0 && currentLessonIndex < trackLessons.length - 1;
  const hasPrev = currentLessonIndex > 0;
  const isCurrentCompleted = currentLesson ? completedLessonIds.includes(currentLesson.id) : false;

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] transition-colors">
      
      {/* Barra superior de seleção de trilhas e botão de 3 barras para recolher/expandir exercícios */}
      <div className="border-b border-white/70 dark:border-sky-500/20 bg-white/60 dark:bg-[#071c32]/70 px-4 py-2 flex items-center justify-between backdrop-blur-xl transition-colors">
        
        {/* Pílulas de seleção de trilha (Java, Python, JS, HTML, CSS) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {tracks.map((t) => {
            const isSelected = t.id === currentTrackId;
            return (
              <button
                key={t.id}
                onClick={() => setCurrentTrackId(t.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'aero-btn-primary shadow-xs'
                    : 'aero-btn-glass text-slate-700 dark:text-sky-200'
                }`}
              >
                <LanguageIcon trackId={t.id} className="w-3.5 h-3.5" />
                <span>{t.name}</span>
                {isSelected && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/20 text-white font-bold">
                    {progressPercent}%
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Botão de 3 Barras (Menu) para fechar/abrir a aba de exercícios e entrar em modo Tela Cheia */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title={isSidebarOpen ? "Fechar aba de exercícios (Modo Tela Cheia)" : "Abrir aba de exercícios"}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 shadow-xs ${
            isSidebarOpen
              ? 'aero-btn-glass text-slate-700 dark:text-sky-200'
              : 'aero-btn-primary'
          }`}
        >
          <Menu className="h-4 w-4" />
          <span>{isSidebarOpen ? "Fechar Exercícios" : "Abrir Exercícios"}</span>
        </button>

      </div>

      {/* Área de Trabalho Principal (Workspace de Aprendizado) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Barra Lateral com a Lista de Exercícios (Retrátil com animação suave) */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-30 bg-white/90 lg:bg-white/70 dark:bg-[#061b30]/95 lg:dark:bg-[#061b30]/75 border-r border-white/80 dark:border-sky-500/20 flex flex-col transition-all duration-300 ease-in-out backdrop-blur-xl shadow-lg lg:shadow-none
            top-16 lg:top-0 h-[calc(100vh-4rem)]
            ${isSidebarOpen
              ? 'w-72 translate-x-0 opacity-100'
              : 'w-0 -translate-x-full lg:w-0 lg:translate-x-0 opacity-0 pointer-events-none border-r-0 overflow-hidden'
            }
          `}
        >
          {/* Cabeçalho da Barra Lateral com Progresso e Botão X de Fechar */}
          <div className="p-4 border-b border-sky-100 dark:border-sky-900/60 shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <LanguageIcon trackId={currentTrack.id} className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300 font-mono truncate">
                  Trilha {currentTrack.name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-500 dark:text-sky-300/70 font-mono">
                  {completedCount}/{trackLessons.length}
                </span>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  title="Fechar aba de exercícios (Tela Cheia)"
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-sky-100/60 dark:hover:bg-sky-900/60 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            {/* Barra de progresso visual em gradiente Frutiger Aero */}
            <div className="h-2 w-full rounded-full bg-sky-100 dark:bg-sky-950/80 overflow-hidden p-0.5 border border-sky-200/60 dark:border-sky-800/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Lista com todas as lições da trilha selecionada */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
            {trackLessons.map((lesson) => {
              const isSelected = lesson.id === currentLesson?.id;
              const isDone = completedLessonIds.includes(lesson.id);

              return (
                <button
                  key={lesson.id}
                  onClick={() => {
                    setCurrentLessonId(lesson.id);
                    // Em telas menores que desktop, fecha a barra ao clicar em uma lição
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      setIsSidebarOpen(false);
                    }
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all ${
                    isSelected
                      ? 'bg-sky-100/90 dark:bg-sky-950/90 border border-sky-300 dark:border-sky-700/80 text-sky-900 dark:text-sky-100 font-bold shadow-xs'
                      : 'text-slate-600 dark:text-sky-200/80 hover:text-slate-900 dark:hover:text-white hover:bg-sky-50 dark:hover:bg-sky-900/40 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    {/* Indicador de lição concluída ou pendente */}
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-sky-300 dark:text-sky-700 shrink-0" />
                    )}
                    <div className="truncate">
                      <div className="truncate font-medium">{lesson.title}</div>
                      <div className="text-[10px] text-slate-400 dark:text-sky-300/50 font-mono">{lesson.category}</div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 shrink-0">
                    +{lesson.xp}XP
                  </span>
                </button>
              );
            })}
          </div>

          {/* Rodapé da barra lateral com dica rápida */}
          <div className="p-3 border-t border-sky-100 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/40 text-[11px] text-slate-500 dark:text-sky-300/70">
            Dica: Conclua os desafios para subir de nível e liberar insígnias.
          </div>
        </aside>

        {/* Divisão dos Painéis de Teoria + Editor de Código + Console */}
        <div className="flex-1 flex flex-col xl:flex-row gap-3 p-3 lg:p-4 overflow-y-auto">
          
          {/* Painel Esquerdo: Explicação Teórica e Instruções do Desafio */}
          <div className="w-full xl:w-[42%] h-[550px] xl:h-auto min-h-[480px]">
            {currentLesson ? (
              <TheoryPanel
                lesson={currentLesson}
                isCompleted={isCurrentCompleted}
                onNext={nextLesson}
                onPrev={prevLesson}
                hasNext={hasNext}
                hasPrev={hasPrev}
                onLoadSolution={handleLoadSolution}
              />
            ) : (
              <div className="p-8 text-center text-slate-400 dark:text-sky-400/60">
                Selecione uma lição para iniciar.
              </div>
            )}
          </div>

          {/* Painel Direito: Editor de Código (superior) e Console/Testes (inferior) */}
          <div className="w-full xl:w-[58%] flex flex-col gap-3 min-h-[600px] xl:h-auto">
            
            {/* Editor de Código com IntelliSense e Snippets estilo VS Code */}
            <div className="flex-1 min-h-[380px]">
              <CodeEditor
                code={editorCode}
                onChange={handleCodeChange}
                onRun={handleRunCode}
                onTest={handleTestChallenge}
                onReset={handleResetCode}
                trackId={currentTrackId}
                isRunning={isRunning}
                isTesting={isTesting}
              />
            </div>

            {/* Console de Saída e Validador de Casos de Teste */}
            <div className="h-64 min-h-[220px]">
              <ConsoleOutput
                result={executionResult}
                testResults={testResults}
                onClear={() => {
                  setExecutionResult(null);
                  setTestResults([]);
                }}
                activeSubTab={activeConsoleTab}
                setActiveSubTab={setActiveConsoleTab}
              />
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
