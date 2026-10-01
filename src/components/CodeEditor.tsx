import React, { useRef, useState, useEffect } from 'react';
// Ícones do Lucide para ações do editor (Executar, Testar, Copiar, etc.)
import { 
  Play, 
  CheckCircle2, 
  RotateCcw, 
  Copy, 
  Check, 
  FileCode, 
  Loader2,
  Zap,
  Sparkles,
  X
} from 'lucide-react';
// Tipos TypeScript para identificar a linguagem ativa ('java', 'python', etc.)
import { TrackId } from '../types';
// Catálogo de snippets (atalhos como sout, main, def, clg) por linguagem
import { getSnippetsByTrack, CodeSnippet } from '../data/snippets';

/**
 * Interface que define as propriedades recebidas pelo CodeEditor
 */
interface CodeEditorProps {
  code: string;                      // Texto de código exibido no editor
  onChange: (value: string) => void; // Callback chamado quando o usuário digita
  onRun: () => void;                 // Callback para executar o código
  onTest?: () => void;               // Callback opcional para verificar o desafio
  onReset: () => void;               // Callback para restaurar o código inicial
  trackId: TrackId;                  // Identificador da linguagem ativa (java, python, etc.)
  isRunning: boolean;                // Flag indicando se a execução está em andamento
  isTesting?: boolean;               // Flag indicando se o teste do desafio está rodando
}

/**
 * CodeEditor: Editor de código integrado com simulação de IntelliSense estilo VS Code.
 * Suporta atalhos como 'sout', 'main', 'def', 'clg' + Tab, numeração de linhas e barra Frutiger Aero.
 */
export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  onRun,
  onTest,
  onReset,
  trackId,
  isRunning,
  isTesting = false,
}) => {
  // Referência direta para o elemento <textarea> para manipulação precisa do cursor e foco
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Feedback visual de código copiado para a área de transferência
  const [copied, setCopied] = useState(false);
  
  // Controla se o catálogo completo de snippets em formato modal está aberto
  const [showSnippetsMenu, setShowSnippetsMenu] = useState(false);
  
  // --- Estados do Autocompletar / IntelliSense ---
  const [suggestions, setSuggestions] = useState<CodeSnippet[]>([]); // Lista de sugestões ativas
  const [selectedIndex, setSelectedIndex] = useState(0);             // Índice do item selecionado no popover
  const [wordPrefix, setWordPrefix] = useState('');                  // Prefixo digitado antes do cursor (ex: "so", "ma")
  const [showSuggestions, setShowSuggestions] = useState(false);    // Exibe ou oculta o menu flutuante

  // Busca todos os snippets disponíveis para a linguagem atual (ex: Java -> sout, main, fori, etc.)
  const availableSnippets = getSnippetsByTrack(trackId);

  /**
   * getFileName: Retorna o nome do arquivo virtual de acordo com a trilha ativa
   */
  const getFileName = (track: TrackId) => {
    switch (track) {
      case 'java':
        return 'Main.java';
      case 'python':
        return 'main.py';
      case 'javascript':
        return 'app.js';
      case 'html':
        return 'index.html';
      case 'css':
        return 'styles.css';
      default:
        return 'code.txt';
    }
  };

  // Calcula a quantidade de linhas no código para desenhar a coluna de números à esquerda
  const lines = code.split('\n');
  const lineCount = Math.max(lines.length, 12); // Garante um mínimo de 12 linhas visuais

  /**
   * updateSuggestions: Analisa a palavra digitada antes do cursor.
   * Se houver correspondência com algum snippet da linguagem, ativa o popover IntelliSense.
   */
  const updateSuggestions = (text: string, cursorPos: number) => {
    const textBeforeCursor = text.substring(0, cursorPos);
    const match = textBeforeCursor.match(/([a-zA-Z0-9_]+)$/);
    const currentWord = match ? match[1] : '';

    if (currentWord.length >= 1) {
      const filtered = availableSnippets.filter((s) =>
        s.prefix.toLowerCase().startsWith(currentWord.toLowerCase())
      );

      if (filtered.length > 0) {
        setSuggestions(filtered);
        setWordPrefix(currentWord);
        setSelectedIndex(0);
        setShowSuggestions(true);
        return;
      }
    }

    // Se não houver correspondência, oculta o popover
    setShowSuggestions(false);
    setSuggestions([]);
    setWordPrefix('');
  };

  /**
   * insertSnippet: Substitui o prefixo digitado pelo bloco completo do snippet e reposiciona o cursor.
   */
  const insertSnippet = (snippet: CodeSnippet) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursor = textarea.selectionStart;
    const prefixLen = wordPrefix.length;
    const startPos = cursor - prefixLen;
    const endPos = textarea.selectionEnd;

    // Substitui a palavra digitada pelo template do snippet
    const newCode = code.substring(0, startPos) + snippet.body + code.substring(endPos);
    onChange(newCode);

    setShowSuggestions(false);
    setShowSnippetsMenu(false);

    // Reposiciona o cursor no final do snippet inserido
    requestAnimationFrame(() => {
      const newCursor = startPos + snippet.body.length;
      textarea.selectionStart = textarea.selectionEnd = newCursor;
      textarea.focus();
    });
  };

  /**
   * handleKeyDown: Captura atalhos de teclado no editor:
   * - Ctrl + Enter: Executa o código
   * - Ctrl + Espaço: Abre menu de sugestões
   * - Setas Cima / Baixo: Navega pelas sugestões do autocompletar
   * - Tab / Enter: Confirma e insere a sugestão selecionada
   * - Tab simples: Insere 4 espaços de indentação padrão
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 1. Executar Código: Ctrl + Enter ou Cmd + Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onRun();
      return;
    }

    // 2. Forçar Abertura do IntelliSense: Ctrl + Espaço
    if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
      e.preventDefault();
      setSuggestions(availableSnippets);
      setSelectedIndex(0);
      setWordPrefix('');
      setShowSuggestions(true);
      return;
    }

    // 3. Comportamento com Popover de Sugestões Aberto
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        insertSnippet(suggestions[selectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
    }

    // 4. Tab Comum: Insere 4 espaços no cursor (sem quebrar o foco da página)
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const spaces = '    ';

      const newCode = code.substring(0, start) + spaces + code.substring(end);
      onChange(newCode);

      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
      });
    }
  };

  /**
   * handleTextChange: Atualiza o código ao digitar e avalia novos snippets
   */
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChange(val);
    updateSuggestions(val, e.target.selectionStart);
  };

  /**
   * handleSelectionChange: Monitora a posição do cursor ao clicar ou usar setas
   */
  const handleSelectionChange = () => {
    if (textareaRef.current) {
      updateSuggestions(code, textareaRef.current.selectionStart);
    }
  };

  /**
   * handleCopy: Copia o código completo para a área de transferência do usuário
   */
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="aero-card relative flex flex-col h-full overflow-hidden transition-colors">
      
      {/* Barra de Título Superior Frutiger Aero (Orbes Aqua + Aba de Arquivo + Botões de Ação) */}
      <div className="relative flex items-center justify-between min-h-[46px] h-12 border-b border-sky-100 dark:border-sky-900/60 bg-gradient-to-b from-white/90 via-sky-50/50 to-white/70 dark:from-[#092542]/80 dark:via-[#071c33]/70 dark:to-[#051629]/80 px-3 sm:px-4 transition-colors">
        {/* Linha de reflexo especular estilo vidro Aero */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/60 dark:from-sky-300/10 to-transparent pointer-events-none" />

        {/* Lado Esquerdo: Orbes de Janela, Aba do Arquivo e Botão de Snippets */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Orbes circulares esmaltados (Fechar, Minimizar, Maximizar) */}
          <div className="flex items-center gap-1.5 mr-0.5 shrink-0">
            <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-b from-rose-400 to-rose-600 border border-rose-500/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.1)]" />
            <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 border border-amber-500/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.1)]" />
            <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 border border-emerald-500/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.1)]" />
          </div>

          {/* Aba do arquivo ativo (ex: Main.java, main.py) */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-sky-950/80 border border-sky-200/80 dark:border-sky-800/80 text-sky-800 dark:text-sky-200 text-xs font-mono font-semibold shadow-xs shrink-0 whitespace-nowrap">
            <FileCode className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
            <span>{getFileName(trackId)}</span>
          </div>

          {/* Botão para abrir o catálogo de Snippets da linguagem */}
          <button
            onClick={() => setShowSnippetsMenu(!showSnippetsMenu)}
            title="Abrir catálogo de snippets (Atalhos com Tab)"
            className="aero-btn-glass flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-semibold shrink-0 whitespace-nowrap"
          >
            <Zap className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
            <span className="hidden xs:inline">Snippets (Tab)</span>
            <span className="xs:hidden">Snippets</span>
          </button>
        </div>

        {/* Lado Direito: Ações de Copiar, Restaurar, Verificar Desafio e Executar */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
          {/* Botão Copiar */}
          <button
            onClick={handleCopy}
            title="Copiar código"
            className="flex items-center gap-1 px-2 py-1 text-xs font-mono text-slate-600 dark:text-sky-300/80 hover:text-sky-700 dark:hover:text-white hover:bg-sky-100/60 dark:hover:bg-sky-900/40 rounded-full transition-colors shrink-0 whitespace-nowrap"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden md:inline">{copied ? 'Copiado!' : 'Copiar'}</span>
          </button>

          {/* Botão Restaurar Código Original da Lição */}
          <button
            onClick={onReset}
            title="Restaurar código inicial da lição"
            className="flex items-center gap-1 px-2 py-1 text-xs font-mono text-slate-600 dark:text-sky-300/80 hover:text-sky-700 dark:hover:text-white hover:bg-sky-100/60 dark:hover:bg-sky-900/40 rounded-full transition-colors shrink-0 whitespace-nowrap"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Restaurar</span>
          </button>

          {/* Botão Verificar Desafio (Verde Esmeralda Esmaltado) */}
          {onTest && (
            <button
              onClick={onTest}
              disabled={isRunning || isTesting}
              className="aero-btn-success flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs shadow-sm disabled:opacity-50 shrink-0 whitespace-nowrap"
            >
              {isTesting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              <span>Verificar</span>
            </button>
          )}

          {/* Botão Executar Código (Azul Aqua Esmaltado) */}
          <button
            onClick={onRun}
            disabled={isRunning || isTesting}
            className="aero-btn-primary flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 text-xs shadow-sm disabled:opacity-50 shrink-0 whitespace-nowrap"
          >
            {isRunning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
            ) : (
              <Play className="h-3.5 w-3.5 fill-white" />
            )}
            <span>Executar</span>
          </button>
        </div>
      </div>

      {/* Corpo Central do Editor: Coluna de Números + Área Textarea de Digitação */}
      <div className="relative flex flex-1 overflow-hidden font-mono text-sm leading-relaxed bg-[#f8fafc] dark:bg-[#051323]">
        
        {/* Coluna com Numeração de Linhas */}
        <div className="select-none py-3 px-3 text-right text-xs text-sky-400/80 dark:text-sky-600/70 bg-sky-50/50 dark:bg-[#030e1a] border-r border-sky-100 dark:border-sky-900/60 font-mono min-w-[3rem]">
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i} className="leading-6">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Textarea para Escrita de Código */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onClick={handleSelectionChange}
          onKeyUp={handleSelectionChange}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          placeholder="// Digite seu código aqui..."
          className="flex-1 w-full h-full resize-none bg-transparent p-3 text-slate-900 dark:text-sky-100 outline-none font-mono text-sm leading-6 selection:bg-sky-400/30 focus:ring-0 border-0 whitespace-pre overflow-auto"
          style={{ tabSize: 4 }}
        />

        {/* Menu Flutuante de Sugestões IntelliSense Estilo VS Code */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="aero-card absolute left-16 bottom-10 z-30 w-80 max-w-[90%] p-2 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-sky-100 dark:border-sky-800/60 text-[10px] font-mono text-sky-700 dark:text-sky-300 font-semibold">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-sky-500" />
                Sugestões IntelliSense
              </span>
              <span className="text-slate-400 dark:text-sky-400/60">Tab ou Enter</span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {suggestions.map((snippet, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={snippet.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertSnippet(snippet);
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-xs font-mono transition-colors ${
                      isSelected
                        ? 'bg-sky-600 text-white font-bold shadow-xs'
                        : 'text-slate-700 dark:text-sky-200 hover:bg-sky-100/70 dark:hover:bg-sky-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${isSelected ? 'bg-sky-700 text-white' : 'bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300'}`}>
                        {snippet.prefix}
                      </span>
                      <span className="truncate">{snippet.description}</span>
                    </div>
                    <span className="text-[10px] opacity-75 font-sans ml-2">Tab</span>
                  </div>
                );
              })}
            </div>
            
            <div className="px-2 pt-1.5 border-t border-sky-100 dark:border-sky-900/60 text-[10px] text-slate-400 dark:text-sky-400/60 flex items-center justify-between">
              <span>↑/↓ navegar</span>
              <span>Esc para fechar</span>
            </div>
          </div>
        )}

      </div>

      {/* Modal Completo com o Catálogo de Snippets da Linguagem */}
      {showSnippetsMenu && (
        <div className="absolute inset-0 z-40 bg-sky-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="aero-card w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-sky-100 dark:border-sky-800/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-300 flex items-center justify-center border border-sky-200 dark:border-sky-700/60 shadow-xs">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                    Snippets & Autocompletar ({trackId.toUpperCase()})
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-sky-300/70">
                    Digite o prefixo e aperte <kbd className="px-1.5 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 border border-sky-300 dark:border-sky-800 font-mono font-bold text-sky-700 dark:text-sky-300">Tab</kbd> no editor
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSnippetsMenu(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-sky-100/60 dark:hover:bg-sky-900/60 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {availableSnippets.map((snippet) => (
                <div
                  key={snippet.id}
                  onClick={() => insertSnippet(snippet)}
                  className="group flex items-center justify-between p-2.5 rounded-xl border border-sky-100 dark:border-sky-900/60 bg-white/80 dark:bg-sky-950/40 hover:border-sky-400 dark:hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/40 cursor-pointer shadow-xs transition-all"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-mono font-bold text-xs shadow-xs">
                        {snippet.prefix}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-sky-100">
                        {snippet.label}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 dark:text-sky-300/70">
                      {snippet.description}
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 group-hover:underline">
                    Inserir →
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-sky-100 dark:border-sky-800/60 text-center text-xs text-slate-500 dark:text-sky-300/60">
              Dica: Você também pode apertar <kbd className="px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 font-mono text-sky-700 dark:text-sky-300 font-bold border border-sky-200 dark:border-sky-800">Ctrl + Espaço</kbd> para abrir sugestões.
            </div>
          </div>
        </div>
      )}

      {/* Barra de Rodapé: Contagem de Linhas, Caracteres e Status */}
      <div className="flex items-center justify-between border-t border-sky-100 dark:border-sky-900/60 bg-white/90 dark:bg-[#040e1a] px-4 py-1.5 text-[11px] text-slate-500 dark:text-sky-300/60 font-mono transition-colors">
        <div className="flex items-center gap-3">
          <span>{lines.length} linhas</span>
          <span>{code.length} caracteres</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Tab: Autocompletar
          </span>
          <span>•</span>
          <span>UTF-8 • {trackId.toUpperCase()}</span>
        </div>
      </div>

    </div>
  );
};
