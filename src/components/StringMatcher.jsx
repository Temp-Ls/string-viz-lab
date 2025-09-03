import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Play, RotateCcw, SkipForward } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// String matching algorithms
const kmpSearch = (text, pattern) => {
  const matches = [];
  const steps = [];
  
  if (!pattern) return { matches, steps };
  
  // Build failure function
  const failure = [0];
  let j = 0;
  
  for (let i = 1; i < pattern.length; i++) {
    while (j > 0 && pattern[i] !== pattern[j]) {
      j = failure[j - 1];
    }
    if (pattern[i] === pattern[j]) {
      j++;
    }
    failure[i] = j;
  }
  
  // Search
  j = 0;
  for (let i = 0; i < text.length; i++) {
    while (j > 0 && text[i] !== pattern[j]) {
      j = failure[j - 1];
    }
    if (text[i] === pattern[j]) {
      j++;
    }
    if (j === pattern.length) {
      matches.push(i - j + 1);
      steps.push({
        position: i - j + 1,
        step: steps.length,
        algorithm: 'KMP',
        comparison: i + 1
      });
      j = failure[j - 1];
    }
  }
  
  return { matches, steps };
};

const rabinKarpSearch = (text, pattern) => {
  const matches = [];
  const steps = [];
  
  if (!pattern) return { matches, steps };
  
  const base = 256;
  const prime = 101;
  const patternLength = pattern.length;
  const textLength = text.length;
  
  let patternHash = 0;
  let textHash = 0;
  let h = 1;
  
  // Calculate h = base^(patternLength-1) % prime
  for (let i = 0; i < patternLength - 1; i++) {
    h = (h * base) % prime;
  }
  
  // Calculate hash of pattern and first window
  for (let i = 0; i < patternLength; i++) {
    patternHash = (base * patternHash + pattern.charCodeAt(i)) % prime;
    textHash = (base * textHash + text.charCodeAt(i)) % prime;
  }
  
  // Slide the pattern
  for (let i = 0; i <= textLength - patternLength; i++) {
    if (patternHash === textHash) {
      let match = true;
      for (let j = 0; j < patternLength; j++) {
        if (text[i + j] !== pattern[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        matches.push(i);
        steps.push({
          position: i,
          step: steps.length,
          algorithm: 'Rabin-Karp',
          comparison: i + patternLength
        });
      }
    }
    
    // Calculate hash for next window
    if (i < textLength - patternLength) {
      textHash = (base * (textHash - text.charCodeAt(i) * h) + text.charCodeAt(i + patternLength)) % prime;
      if (textHash < 0) textHash += prime;
    }
  }
  
  return { matches, steps };
};

const zAlgorithmSearch = (text, pattern) => {
  const matches = [];
  const steps = [];
  
  if (!pattern) return { matches, steps };
  
  const combined = pattern + '$' + text;
  const z = new Array(combined.length).fill(0);
  
  let l = 0, r = 0;
  for (let i = 1; i < combined.length; i++) {
    if (i <= r) {
      z[i] = Math.min(r - i + 1, z[i - l]);
    }
    
    while (i + z[i] < combined.length && combined[z[i]] === combined[i + z[i]]) {
      z[i]++;
    }
    
    if (i + z[i] - 1 > r) {
      l = i;
      r = i + z[i] - 1;
    }
    
    if (z[i] === pattern.length) {
      const position = i - pattern.length - 1;
      matches.push(position);
      steps.push({
        position,
        step: steps.length,
        algorithm: 'Z-Algorithm',
        comparison: i
      });
    }
  }
  
  return { matches, steps };
};

const algorithms = {
  'kmp': { name: 'KMP', func: kmpSearch, color: 'bg-primary' },
  'rabin-karp': { name: 'Rabin-Karp', func: rabinKarpSearch, color: 'bg-accent' },
  'z-algorithm': { name: 'Z-Algorithm', func: zAlgorithmSearch, color: 'bg-success' }
};

export default function StringMatcher() {
  const [text, setText] = useState('abababcabababcabcabc');
  const [pattern, setPattern] = useState('ababc');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('kmp');
  const [results, setResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [visualization, setVisualization] = useState(false);
  const { toast } = useToast();

  const runAlgorithm = () => {
    if (!text || !pattern) {
      toast({
        title: "Input required",
        description: "Please enter both text and pattern",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    const start = performance.now();
    const result = algorithms[selectedAlgorithm].func(text, pattern);
    const end = performance.now();
    
    setResults({
      ...result,
      time: end - start,
      algorithm: selectedAlgorithm
    });
    setCurrentStep(0);
    setIsRunning(false);
    
    toast({
      title: "Algorithm completed",
      description: `Found ${result.matches.length} matches in ${(end - start).toFixed(2)}ms`
    });
  };

  const runAllAlgorithms = () => {
    if (!text || !pattern) return;
    
    const allResults = {};
    Object.keys(algorithms).forEach(alg => {
      const start = performance.now();
      const result = algorithms[alg].func(text, pattern);
      const end = performance.now();
      allResults[alg] = { ...result, time: end - start };
    });
    
    setResults(allResults);
    setVisualization(false);
  };

  const highlightText = (textStr, matches, currentHighlight = -1) => {
    if (!matches || matches.length === 0) return textStr;
    
    let highlighted = textStr;
    const sortedMatches = [...matches].sort((a, b) => b - a);
    
    sortedMatches.forEach((match, index) => {
      const isActive = currentHighlight === match;
      const className = isActive ? 'bg-primary text-primary-foreground' : 'text-highlight';
      const start = match;
      const end = match + pattern.length;
      
      highlighted = 
        highlighted.slice(0, start) + 
        `<span class="${className} rounded px-1 font-bold transition-smooth">${highlighted.slice(start, end)}</span>` + 
        highlighted.slice(end);
    });
    
    return highlighted;
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            String Matching Engine
          </h1>
          <p className="text-muted-foreground text-lg">
            Visualize KMP, Rabin-Karp, and Z-Algorithm implementations
          </p>
        </div>

        {/* Input Section */}
        <Card className="glow-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Input Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Text</label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter the text to search in..."
                className="font-mono text-sm min-h-20"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Pattern</label>
              <Input
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="Enter the pattern to search for..."
                className="font-mono"
              />
            </div>
            
            <div className="flex gap-4 items-end">
              <div className="space-y-2 flex-1">
                <label className="text-sm font-medium">Algorithm</label>
                <Select value={selectedAlgorithm} onValueChange={setSelectedAlgorithm}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(algorithms).map(([key, alg]) => (
                      <SelectItem key={key} value={key}>{alg.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={runAlgorithm} disabled={isRunning} className="glow-effect">
                  <Play className="w-4 h-4 mr-2" />
                  Run
                </Button>
                <Button onClick={runAllAlgorithms} variant="secondary">
                  Compare All
                </Button>
                <Button onClick={() => setResults({})} variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {Object.keys(results).length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visualization */}
            <Card>
              <CardHeader>
                <CardTitle>Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                {results.matches ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-secondary rounded-lg">
                      <div 
                        className="font-mono text-sm leading-relaxed break-all"
                        dangerouslySetInnerHTML={{
                          __html: highlightText(text, results.matches)
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        {results.matches.length} matches found
                      </Badge>
                      <Badge variant="outline">
                        Time: {results.time?.toFixed(2)}ms
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(results).map(([alg, result]) => (
                      <div key={alg} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${algorithms[alg].color}`} />
                          <span className="font-medium">{algorithms[alg].name}</span>
                          <Badge variant="outline">{result.matches.length} matches</Badge>
                          <Badge variant="secondary">{result.time.toFixed(2)}ms</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                {results.time ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">
                        {results.time.toFixed(2)}ms
                      </div>
                      <div className="text-muted-foreground">
                        {algorithms[selectedAlgorithm].name} execution time
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(results).map(([alg, result]) => (
                      <div key={alg} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span>{algorithms[alg].name}</span>
                          <span className="font-mono">{result.time.toFixed(2)}ms</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className={`${algorithms[alg].color} h-2 rounded-full transition-smooth`}
                            style={{ 
                              width: `${(result.time / Math.max(...Object.values(results).map(r => r.time))) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}