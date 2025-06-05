import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useSimulatorStore } from '../store/simulatorStore';

interface CompileError {
  line: number;
  message: string;
  type: 'error' | 'warning';
}

interface CompileResult {
  success: boolean;
  errors: CompileError[];
  instructionCount: number;
}

const CodeEditor: React.FC = () => {
  const editorRef = useRef<any>(null);
  const [compileResult, setCompileResult] = useState<CompileResult | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  
  const {
    sourceCode,
    setSourceCode,
    loadProgram,
    cpu,
    currentStep,
  } = useSimulatorStore();

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Register LEGv8 language
    monaco.languages.register({ id: 'legv8' });

    // Define LEGv8 syntax highlighting
    monaco.languages.setMonarchTokensProvider('legv8', {
      tokenizer: {
        root: [
          // Comments (LEGv8 uses semicolon for comments)
          [/;.*$/, 'comment'],
          
          // Instructions
          [/\b(ADD|SUB|AND|ORR|EOR|LSL|LSR|BR|B\.EQ|B\.NE|B\.LT|B\.LE|B\.GT|B\.GE|B\.MI|B\.PL|B\.VS|B\.VC|B\.HI|B\.LS|B\.AL|CBZ|CBNZ|B|BL|ADDI|SUBI|ANDI|ORRI|EORI|LDUR|STUR|LDURB|STURB|LDURH|STURH|LDURSW|MOVZ|MOVK|CMP|CMPI|ADDS|SUBS|ANDS|NOP)\b/, 'keyword'],
          
          // Registers
          [/\b(X[0-9]|X[12][0-9]|X3[01]|XZR|SP|FP|LR)\b/, 'variable'],
          
          // Numbers
          [/#-?\d+/, 'number'],
          [/\b0x[0-9a-fA-F]+\b/, 'number'],
          [/\b\d+\b/, 'number'],
          
          // Labels
          [/^[a-zA-Z_][a-zA-Z0-9_]*:/, 'type'],
          
          // Strings
          [/".*?"/, 'string'],
          
          // Brackets and operators
          [/[[\]]/, 'delimiter.bracket'],
          [/[,]/, 'delimiter'],
        ],
      },
    });

    // Define LEGv8 theme
    monaco.editor.defineTheme('legv8-theme', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '0066CC', fontStyle: 'bold' },
        { token: 'variable', foreground: '008000', fontStyle: 'bold' },
        { token: 'number', foreground: 'FF6600' },
        { token: 'comment', foreground: '808080', fontStyle: 'italic' },
        { token: 'string', foreground: 'CC0000' },
        { token: 'type', foreground: '800080', fontStyle: 'bold' },
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.lineHighlightBackground': '#E3F2FD',
        'editorLineNumber.foreground': '#999999',
        'editorLineNumber.activeForeground': '#0066CC',
      }
    });

    // Set the theme
    monaco.editor.setTheme('legv8-theme');
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setSourceCode(value);
      // Clear previous compile results when code changes
      setCompileResult(null);
    }
  };

  const validateLEGv8Syntax = (code: string): CompileResult => {
    const errors: CompileError[] = [];
    const lines = code.split('\n');
    let instructionCount = 0;

    // Valid LEGv8 instructions
    const validInstructions = [
      'ADD', 'SUB', 'AND', 'ORR', 'EOR', 'LSL', 'LSR',
      'ADDI', 'SUBI', 'ANDI', 'ORRI', 'EORI',
      'LDUR', 'STUR', 'LDURB', 'STURB', 'LDURH', 'STURH', 'LDURSW',
      'B', 'BL', 'BR', 'CBZ', 'CBNZ',
      'B.EQ', 'B.NE', 'B.LT', 'B.LE', 'B.GT', 'B.GE',
      'B.MI', 'B.PL', 'B.VS', 'B.VC', 'B.HI', 'B.LS', 'B.AL',
      'CMP', 'CMPI', 'ADDS', 'SUBS', 'ANDS',
      'MOVZ', 'MOVK', 'NOP'
    ];

    // Valid registers
    const validRegisters = [
      ...Array.from({length: 32}, (_, i) => `X${i}`),
      'XZR', 'SP', 'FP', 'LR'
    ];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) {
        return;
      }

      // Remove inline comments (everything after semicolon)
      const lineWithoutComment = trimmedLine.split(';')[0].trim();
      
      // Skip if line becomes empty after removing comment
      if (!lineWithoutComment) {
        return;
      }

      // Check for labels
      if (lineWithoutComment.match(/^[a-zA-Z_][a-zA-Z0-9_]*:$/)) {
        return; // Valid label
      }

      // Parse instruction (now without comments)
      const parts = lineWithoutComment.split(/\s+/);
      if (parts.length === 0) return;

      const instruction = parts[0].toUpperCase();
      
      // Check if instruction is valid
      if (!validInstructions.includes(instruction)) {
        errors.push({
          line: index + 1,
          message: `Unknown instruction: ${instruction}`,
          type: 'error'
        });
        return;
      }

      instructionCount++;

      // Basic syntax validation for different instruction types
      if (['ADD', 'SUB', 'AND', 'ORR', 'EOR'].includes(instruction)) {
        // R-type: ADD Rd, Rn, Rm
        if (parts.length !== 4) {
          errors.push({
            line: index + 1,
            message: `${instruction} requires 3 operands: ${instruction} Rd, Rn, Rm`,
            type: 'error'
          });
          return;
        }

        // Validate registers
        const registers = parts.slice(1).map(r => r.replace(',', '').toUpperCase());
        registers.forEach((reg, regIndex) => {
          if (!validRegisters.includes(reg)) {
            errors.push({
              line: index + 1,
              message: `Invalid register: ${reg}`,
              type: 'error'
            });
          }
        });
      }

      if (['ADDI', 'SUBI', 'ANDI', 'ORRI', 'EORI'].includes(instruction)) {
        // I-type: ADDI Rd, Rn, #immediate
        if (parts.length !== 4) {
          errors.push({
            line: index + 1,
            message: `${instruction} requires 3 operands: ${instruction} Rd, Rn, #immediate`,
            type: 'error'
          });
          return;
        }

        // Check immediate value format
        const immediate = parts[3];
        if (!immediate.startsWith('#')) {
          errors.push({
            line: index + 1,
            message: `Immediate value must start with #: ${immediate}`,
            type: 'error'
          });
        } else {
          const value = immediate.substring(1);
          const numValue = parseInt(value);
          if (isNaN(numValue) || numValue < -2048 || numValue > 2047) {
            errors.push({
              line: index + 1,
              message: `Immediate value out of range (-2048 to 2047): ${value}`,
              type: 'warning'
            });
          }
        }
      }

      if (['LDUR', 'STUR'].includes(instruction)) {
        // D-type: LDUR Rt, [Rn, #offset]
        if (parts.length < 3) {
          errors.push({
            line: index + 1,
            message: `${instruction} requires memory address format: ${instruction} Rt, [Rn, #offset]`,
            type: 'error'
          });
          return;
        }

        // Check memory address format
        const memoryPart = parts.slice(2).join(' ');
        if (!memoryPart.match(/\[.*\]/)) {
          errors.push({
            line: index + 1,
            message: `Memory address must be enclosed in brackets: ${memoryPart}`,
            type: 'error'
          });
        }
      }

      if (['CBZ', 'CBNZ'].includes(instruction)) {
        // CB-type: CBZ Rt, label
        if (parts.length !== 3) {
          errors.push({
            line: index + 1,
            message: `${instruction} requires 2 operands: ${instruction} Rt, label`,
            type: 'error'
          });
        }
      }

      if (instruction.startsWith('B.') || instruction === 'B') {
        // B-type: B label or B.cond label
        if (parts.length !== 2 && instruction !== 'B') {
          errors.push({
            line: index + 1,
            message: `${instruction} requires 1 operand: ${instruction} label`,
            type: 'error'
          });
        }
      }
    });

    return {
      success: errors.filter(e => e.type === 'error').length === 0,
      errors,
      instructionCount
    };
  };

  const formatCode = (code: string): string => {
    const lines = code.split('\n');
    const formattedLines = lines.map(line => {
      const trimmed = line.trim();
      
      // Skip empty lines
      if (!trimmed) {
        return line;
      }
      
      // If line starts with comment, keep as is
      if (trimmed.startsWith(';')) {
        return line;
      }
      
      // Remove inline comment to check the instruction part
      const lineWithoutComment = trimmed.split(';')[0].trim();
      
      // Skip if line becomes empty after removing comment
      if (!lineWithoutComment) {
        return line;
      }
      
      // Check if it's a label (ends with colon)
      if (lineWithoutComment.match(/^[a-zA-Z_][a-zA-Z0-9_]*:$/)) {
        return trimmed; // Labels stay at column 0
      }
      
      // Check if it's an instruction
      const parts = lineWithoutComment.split(/\s+/);
      if (parts.length > 0) {
        const instruction = parts[0].toUpperCase();
        const validInstructions = [
          'ADD', 'SUB', 'AND', 'ORR', 'EOR', 'LSL', 'LSR',
          'ADDI', 'SUBI', 'ANDI', 'ORRI', 'EORI',
          'LDUR', 'STUR', 'LDURB', 'STURB', 'LDURH', 'STURH', 'LDURSW',
          'B', 'BL', 'BR', 'CBZ', 'CBNZ',
          'B.EQ', 'B.NE', 'B.LT', 'B.LE', 'B.GT', 'B.GE',
          'B.MI', 'B.PL', 'B.VS', 'B.VC', 'B.HI', 'B.LS', 'B.AL',
          'CMP', 'CMPI', 'ADDS', 'SUBS', 'ANDS',
          'MOVZ', 'MOVK', 'NOP'
        ];
        
        if (validInstructions.includes(instruction)) {
          return '\t' + trimmed; // Add tab indentation for instructions (preserve original line with comments)
        }
      }
      
      return line; // Return original line if not recognized
    });
    
    return formattedLines.join('\n');
  };

  const handleCompile = () => {
    setIsCompiling(true);
    
    // Simulate compilation delay
    setTimeout(() => {
      const result = validateLEGv8Syntax(sourceCode);
      setCompileResult(result);
      
      // If compilation is successful, format the code and load the program
      if (result.success) {
        const formattedCode = formatCode(sourceCode);
        setSourceCode(formattedCode);
        parseAndLoadProgram(formattedCode);
      }
      
      setIsCompiling(false);
    }, 500);
  };

  const parseAndLoadProgram = (code: string) => {
    // Parse assembly code into instructions
    const lines = code.split('\n')
      .map(line => {
        const trimmed = line.trim();
        // Remove inline comments (everything after semicolon)
        const withoutComment = trimmed.split(';')[0].trim();
        return withoutComment;
      })
      .filter(line => line && !line.match(/^[a-zA-Z_][a-zA-Z0-9_]*:$/)); // Filter out empty lines and labels

    const instructions = lines.map((line, index) => ({
      address: 0x400000 + index * 4,
      machineCode: '00000000',
      assembly: line.trim(), // Ensure assembly is trimmed
      type: 'R' as const,
      fields: { 
        opcode: line.trim().split(/\s+/)[0] || 'NOP'
      }
    }));

    loadProgram(instructions);
  };

  // Highlight current line
  useEffect(() => {
    if (editorRef.current && cpu.currentInstruction) {
      const editor = editorRef.current;
      const model = editor.getModel();
      
      if (model) {
        // Clear previous decorations
        const oldDecorations = editor.getModel().getAllDecorations();
        const decorationIds = oldDecorations
          .filter((d: any) => d.options.className === 'current-line-highlight')
          .map((d: any) => d.id);
        
        editor.deltaDecorations(decorationIds, []);

        // Find the actual line number of the current instruction in the source code
        const sourceLines = sourceCode.split('\n');
        let actualLineNumber = 1;
        let instructionCount = 0;
        
        for (let i = 0; i < sourceLines.length; i++) {
          const line = sourceLines[i].trim();
          // Remove inline comments and check if it's an instruction
          const lineWithoutComment = line.split(';')[0].trim();
          
          // Skip empty lines, pure comment lines, and labels
          if (lineWithoutComment && !lineWithoutComment.match(/^[a-zA-Z_][a-zA-Z0-9_]*:$/)) {
            if (instructionCount === cpu.currentInstructionIndex) {
              actualLineNumber = i + 1;
              break;
            }
            instructionCount++;
          }
        }

        // Add new decoration for current line
        const decorations = [
          {
            range: {
              startLineNumber: actualLineNumber,
              startColumn: 1,
              endLineNumber: actualLineNumber,
              endColumn: model.getLineMaxColumn(actualLineNumber),
            },
            options: {
              className: 'current-line-highlight',
              isWholeLine: true,
              backgroundColor: '#FFE082',
              marginClassName: 'current-line-margin',
            },
          },
        ];

        editor.deltaDecorations([], decorations);

        // Scroll to current line
        editor.revealLineInCenter(actualLineNumber);
      }
    }
  }, [cpu.currentInstructionIndex, cpu.currentInstruction, sourceCode]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
        <h3 className="text-sm font-semibold text-gray-700">LEGv8 Assembly Editor</h3>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>Step: {currentStep}/{cpu.instructionMemory.length}</span>
            <span>•</span>
            <span>PC: {cpu.pc}</span>
          </div>
          <button
            onClick={handleCompile}
            disabled={isCompiling || !sourceCode.trim()}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              isCompiling
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : compileResult?.success
                ? 'bg-green-500 text-white hover:bg-green-600'
                : compileResult && !compileResult.success
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isCompiling ? '⏳ Compiling...' : '🔨 Compile'}
          </button>
        </div>
      </div>
      
      {/* Compile Results */}
      {compileResult && (
        <div className={`p-3 border-b ${
          compileResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${
              compileResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {compileResult.success ? '✅ Compilation Successful' : '❌ Compilation Failed'}
            </span>
            <span className="text-xs text-gray-600">
              {compileResult.instructionCount} instructions
            </span>
          </div>
          
          {compileResult.errors.length > 0 && (
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {compileResult.errors.map((error, index) => (
                <div key={index} className={`text-xs p-2 rounded ${
                  error.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  <span className="font-medium">Line {error.line}:</span> {error.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="flex-1">
        <Editor
          height="100%"
          language="legv8"
          theme="legv8-theme"
          value={sourceCode}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
            lineNumbersMinChars: 3,
            glyphMargin: true,
            folding: false,
            selectOnLineNumbers: true,
            selectionHighlight: false,
            cursorStyle: 'line',
            renderLineHighlight: 'line',
          }}
        />
      </div>

      {/* Quick reference */}
      <div className="p-2 bg-gray-50 border-t text-xs text-gray-600">
        <details>
          <summary className="cursor-pointer font-medium">LEGv8 Quick Reference</summary>
          <div className="mt-2 space-y-1">
            <div><strong>Arithmetic:</strong> ADD, SUB, ADDI, SUBI</div>
            <div><strong>Logical:</strong> AND, ORR, EOR, ANDI, ORRI, EORI</div>
            <div><strong>Memory:</strong> LDUR, STUR, LDURB, STURB</div>
            <div><strong>Branch:</strong> B, B.EQ, B.NE, CBZ, CBNZ</div>
            <div><strong>Registers:</strong> X0-X31, SP (X28), FP (X29), LR (X30), XZR (X31)</div>
            <div><strong>Comments:</strong> Use semicolon (;) for comments</div>
            <div><strong>Labels:</strong> label: (colon at end)</div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default CodeEditor; 