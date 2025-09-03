import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Play, RotateCcw, SkipForward, Upload, FileText, Pause, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Enhanced string matching algorithms with detailed steps
const kmpSearchDetailed = (text, pattern, caseInsensitive = false) => {
  const matches = [];
  const detailedSteps = [];
  
  if (!pattern) return { matches, detailedSteps, comparisons: 0 };
  
  const searchText = caseInsensitive ? text.toLowerCase() : text;
  const searchPattern = caseInsensitive ? pattern.toLowerCase() : pattern;
  
  // Build failure function with steps
  const failure = [0];
  let j = 0;
  let comparisons = 0;
  
  for (let i = 1; i < searchPattern.length; i++) {
    while (j > 0 && searchPattern[i] !== searchPattern[j]) {
      j = failure[j - 1];
      comparisons++;
    }
    if (searchPattern[i] === searchPattern[j]) {
      j++;
    }
    failure[i] = j;
    comparisons++;
  }
  
  // Search with detailed tracking
  j = 0;
  for (let i = 0; i < searchText.length; i++) {
    const stepStart = { position: i, patternIndex: j, type: 'compare' };
    
    while (j > 0 && searchText[i] !== searchPattern[j]) {
      detailedSteps.push({
        ...stepStart,
        type: 'mismatch',
        shift: j - failure[j - 1],
        description: `Mismatch at text[${i}]='${searchText[i]}' vs pattern[${j}]='${searchPattern[j]}'. Shift pattern by ${j - failure[j - 1]} positions.`
      });
      j = failure[j - 1];
      comparisons++;
    }
    
    if (searchText[i] === searchPattern[j]) {
      detailedSteps.push({
        ...stepStart,
        type: 'match',
        description: `Match found: text[${i}]='${searchText[i]}' == pattern[${j}]='${searchPattern[j]}'`
      });
      j++;
    } else {
      detailedSteps.push({
        ...stepStart,
        type: 'mismatch',
        description: `Mismatch: text[${i}]='${searchText[i]}' != pattern[${j}]='${searchPattern[j]}'`
      });
    }
    
    comparisons++;
    
    if (j === searchPattern.length) {
      const matchPos = i - j + 1;
      matches.push(matchPos);
      detailedSteps.push({
        position: matchPos,
        type: 'found',
        description: `Complete match found at position ${matchPos}`
      });
      j = failure[j - 1];
    }
  }
  
  return { matches, detailedSteps, comparisons };
};

const rabinKarpSearchDetailed = (text, pattern, caseInsensitive = false) => {
  const matches = [];
  const detailedSteps = [];
  
  if (!pattern) return { matches, detailedSteps, comparisons: 0 };
  
  const searchText = caseInsensitive ? text.toLowerCase() : text;
  const searchPattern = caseInsensitive ? pattern.toLowerCase() : pattern;
  
  const base = 256;
  const prime = 101;
  const patternLength = searchPattern.length;
  const textLength = searchText.length;
  let comparisons = 0;
  
  let patternHash = 0;
  let textHash = 0;
  let h = 1;
  
  // Calculate h = base^(patternLength-1) % prime
  for (let i = 0; i < patternLength - 1; i++) {
    h = (h * base) % prime;
  }
  
  // Calculate hash of pattern and first window
  for (let i = 0; i < patternLength; i++) {
    patternHash = (base * patternHash + searchPattern.charCodeAt(i)) % prime;
    textHash = (base * textHash + searchText.charCodeAt(i)) % prime;
  }
  
  // Slide the pattern
  for (let i = 0; i <= textLength - patternLength; i++) {
    detailedSteps.push({
      position: i,
      type: 'hash-compare',
      textHash,
      patternHash,
      description: `Comparing hashes: text hash=${textHash}, pattern hash=${patternHash}`
    });
    
    if (patternHash === textHash) {
      // Hash match - verify character by character
      let match = true;
      for (let j = 0; j < patternLength; j++) {
        comparisons++;
        if (searchText[i + j] !== searchPattern[j]) {
          match = false;
          detailedSteps.push({
            position: i,
            type: 'spurious',
            description: `Spurious match: hash collision at position ${i}`
          });
          break;
        }
      }
      if (match) {
        matches.push(i);
        detailedSteps.push({
          position: i,
          type: 'found',
          description: `Verified match found at position ${i}`
        });
      }
    }
    
    // Calculate hash for next window
    if (i < textLength - patternLength) {
      textHash = (base * (textHash - searchText.charCodeAt(i) * h) + searchText.charCodeAt(i + patternLength)) % prime;
      if (textHash < 0) textHash += prime;
    }
  }
  
  return { matches, detailedSteps, comparisons };
};

const zAlgorithmSearchDetailed = (text, pattern, caseInsensitive = false) => {
  const matches = [];
  const detailedSteps = [];
  
  if (!pattern) return { matches, detailedSteps, comparisons: 0 };
  
  const searchText = caseInsensitive ? text.toLowerCase() : text;
  const searchPattern = caseInsensitive ? pattern.toLowerCase() : pattern;
  
  const combined = searchPattern + '$' + searchText;
  const z = new Array(combined.length).fill(0);
  let comparisons = 0;
  
  let l = 0, r = 0;
  for (let i = 1; i < combined.length; i++) {
    if (i <= r) {
      z[i] = Math.min(r - i + 1, z[i - l]);
      detailedSteps.push({
        position: i,
        type: 'z-box',
        zValue: z[i],
        description: `Using Z-box: Z[${i}] = min(${r - i + 1}, Z[${i - l}]) = ${z[i]}`
      });
    }
    
    while (i + z[i] < combined.length && combined[z[i]] === combined[i + z[i]]) {
      z[i]++;
      comparisons++;
      detailedSteps.push({
        position: i,
        type: 'extend',
        zValue: z[i],
        description: `Extending Z[${i}] to ${z[i]}`
      });
    }
    
    if (i + z[i] - 1 > r) {
      l = i;
      r = i + z[i] - 1;
      detailedSteps.push({
        position: i,
        type: 'update-box',
        left: l,
        right: r,
        description: `Updating Z-box: [${l}, ${r}]`
      });
    }
    
    if (z[i] === searchPattern.length && i > searchPattern.length) {
      const position = i - searchPattern.length - 1;
      matches.push(position);
      detailedSteps.push({
        position,
        type: 'found',
        description: `Match found at position ${position} (Z[${i}] = ${z[i]})`
      });
    }
  }
  
  return { matches, detailedSteps, comparisons };
};

const algorithms = {
  'kmp': { 
    name: 'Knuth-Morris-Pratt', 
    func: kmpSearchDetailed, 
    color: 'bg-primary',
    description: 'Uses failure function to avoid redundant comparisons'
  },
  'rabin-karp': { 
    name: 'Rabin-Karp', 
    func: rabinKarpSearchDetailed, 
    color: 'bg-accent',
    description: 'Uses rolling hash for efficient pattern matching'
  },
  'z-algorithm': { 
    name: 'Z-Algorithm', 
    func: zAlgorithmSearchDetailed, 
    color: 'bg-success',
    description: 'Constructs Z-array for linear-time pattern matching'
  }
};

export default function StringMatcher() {
  const [text, setText] = useState('abababcabababcabcabc');
  const [patterns, setPatterns] = useState('ababc');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('kmp');
  const [caseInsensitive, setCaseInsensitive] = useState(false);
  const [results, setResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(500);
  const [showSteps, setShowSteps] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  // Auto-play visualization
  useEffect(() => {
    if (isPlaying && results.detailedSteps && currentStep < results.detailedSteps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, playSpeed);
      return () => clearTimeout(timer);
    } else {
      setIsPlaying(false);
    }
  }, [isPlaying, currentStep, results.detailedSteps, playSpeed]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        setText(content);
        toast({
          title: "File uploaded",
          description: `Loaded ${content.length} characters from ${file.name}`
        });
      };
      reader.readAsText(file);
    }
  };

  const parsePatterns = (patternString) => {
    return patternString.split(',').map(p => p.trim()).filter(p => p.length > 0);
  };

  const runAlgorithm = () => {
    const patternList = parsePatterns(patterns);
    if (!text || patternList.length === 0) {
      toast({
        title: "Input required",
        description: "Please enter both text and at least one pattern",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    const allResults = {};
    
    patternList.forEach((pattern, index) => {
      const start = performance.now();
      const result = algorithms[selectedAlgorithm].func(text, pattern, caseInsensitive);
      const end = performance.now();
      
      allResults[`pattern_${index}`] = {
        ...result,
        pattern,
        time: end - start,
        algorithm: selectedAlgorithm
      };
    });
    
    setResults(allResults);
    setCurrentStep(0);
    setIsRunning(false);
    setShowSteps(true);
    
    const totalMatches = Object.values(allResults).reduce((sum, r) => sum + r.matches.length, 0);
    toast({
      title: "Algorithm completed",
      description: `Found ${totalMatches} total matches across ${patternList.length} patterns`
    });
  };

  const runAllAlgorithms = () => {
    const patternList = parsePatterns(patterns);
    if (!text || patternList.length === 0) return;
    
    const benchmarkResults = {};
    Object.keys(algorithms).forEach(alg => {
      const start = performance.now();
      let totalMatches = 0;
      let totalComparisons = 0;
      
      patternList.forEach(pattern => {
        const result = algorithms[alg].func(text, pattern, caseInsensitive);
        totalMatches += result.matches.length;
        totalComparisons += result.comparisons;
      });
      
      const end = performance.now();
      benchmarkResults[alg] = { 
        matches: totalMatches, 
        time: end - start,
        comparisons: totalComparisons
      };
    });
    
    setResults(benchmarkResults);
    setShowSteps(false);
  };

  const highlightText = (textStr, allResults, currentStep = -1) => {
    let highlighted = textStr;
    const colors = ['bg-primary', 'bg-accent', 'bg-success', 'bg-warning', 'bg-info'];
    
    // Collect all matches from all patterns
    const allMatches = [];
    Object.values(allResults).forEach((result, patternIndex) => {
      if (result.matches) {
        result.matches.forEach(match => {
          allMatches.push({
            start: match,
            end: match + result.pattern.length,
            color: colors[patternIndex % colors.length],
            pattern: result.pattern
          });
        });
      }
    });
    
    // Sort matches by position (reverse for safe replacement)
    allMatches.sort((a, b) => b.start - a.start);
    
    allMatches.forEach(match => {
      const className = `${match.color} text-white rounded px-1 font-bold transition-smooth`;
      highlighted = 
        highlighted.slice(0, match.start) + 
        `<span class="${className}" title="Pattern: ${match.pattern}">${highlighted.slice(match.start, match.end)}</span>` + 
        highlighted.slice(match.end);
    });
    
    return highlighted;
  };

  const getCurrentStepInfo = () => {
    if (!results.pattern_0?.detailedSteps || currentStep < 0) return null;
    return results.pattern_0.detailedSteps[currentStep];
  };

  const getChartData = () => {
    if (!results || showSteps) return [];
    
    return Object.entries(results).map(([alg, result]) => ({
      algorithm: algorithms[alg]?.name || alg,
      time: result.time,
      matches: result.matches,
      comparisons: result.comparisons
    }));
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-6 space-y-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Advanced String Matching Engine
            </h1>
            <p className="text-muted-foreground text-lg">
              Interactive visualization of KMP, Rabin-Karp, and Z-Algorithm with real-time analysis
            </p>
          </div>

          {/* Input Section */}
          <Card className="glow-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Input Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Text Input */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Text</Label>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".txt,.csv,.log"
                    className="hidden"
                  />
                </div>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter the text to search in or upload a file..."
                  className="font-mono text-sm min-h-24 resize-y"
                />
                <Badge variant="secondary" className="text-xs">
                  {text.length} characters
                </Badge>
              </div>
              
              {/* Pattern Input */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Patterns 
                  <span className="text-muted-foreground text-xs ml-2">
                    (separate multiple patterns with commas)
                  </span>
                </Label>
                <Input
                  value={patterns}
                  onChange={(e) => setPatterns(e.target.value)}
                  placeholder="e.g., ababc, abc, pattern"
                  className="font-mono"
                />
              </div>
              
              {/* Options */}
              <div className="flex flex-wrap gap-6 items-center">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="case-insensitive"
                    checked={caseInsensitive}
                    onCheckedChange={setCaseInsensitive}
                  />
                  <Label htmlFor="case-insensitive" className="text-sm">
                    Case insensitive
                  </Label>
                </div>
                
                <div className="space-y-2 flex-1 max-w-xs">
                  <Label className="text-sm font-medium">Algorithm</Label>
                  <Select value={selectedAlgorithm} onValueChange={setSelectedAlgorithm}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(algorithms).map(([key, alg]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${alg.color}`} />
                            {alg.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={runAlgorithm} 
                  disabled={isRunning} 
                  className="glow-effect"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run Visualization
                </Button>
                <Button onClick={runAllAlgorithms} variant="secondary">
                  <SkipForward className="w-4 h-4 mr-2" />
                  Benchmark All
                </Button>
                <Button onClick={() => setResults({})} variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          {Object.keys(results).length > 0 && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Visualization Panel */}
              <Card className="xl:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      Visualization
                      {showSteps && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-4 h-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{algorithms[selectedAlgorithm]?.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </CardTitle>
                    {showSteps && results.pattern_0?.detailedSteps && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                          disabled={currentStep === 0}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsPlaying(!isPlaying)}
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentStep(Math.min(results.pattern_0.detailedSteps.length - 1, currentStep + 1))}
                          disabled={currentStep >= results.pattern_0.detailedSteps.length - 1}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Text Visualization */}
                  <div className="p-4 bg-secondary rounded-lg">
                    <div 
                      className="font-mono text-sm leading-relaxed break-all"
                      dangerouslySetInnerHTML={{
                        __html: highlightText(text, results)
                      }}
                    />
                  </div>
                  
                  {/* Step Progress */}
                  {showSteps && results.pattern_0?.detailedSteps && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Step {currentStep + 1} of {results.pattern_0.detailedSteps.length}</span>
                        <div className="flex items-center gap-2">
                          <Label htmlFor="speed">Speed:</Label>
                          <Select value={playSpeed.toString()} onValueChange={(v) => setPlaySpeed(Number(v))}>
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="100">Fast</SelectItem>
                              <SelectItem value="500">Normal</SelectItem>
                              <SelectItem value="1000">Slow</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Progress 
                        value={(currentStep / (results.pattern_0.detailedSteps.length - 1)) * 100} 
                        className="h-2"
                      />
                      
                      {/* Current Step Info */}
                      {getCurrentStepInfo() && (
                        <Card className="p-3 bg-muted">
                          <div className="text-sm">
                            <Badge 
                              variant={getCurrentStepInfo().type === 'found' ? 'default' : 'secondary'}
                              className="mb-2"
                            >
                              {getCurrentStepInfo().type}
                            </Badge>
                            <p className="text-muted-foreground">
                              {getCurrentStepInfo().description}
                            </p>
                          </div>
                        </Card>
                      )}
                    </div>
                  )}
                  
                  {/* Results Summary */}
                  <div className="flex flex-wrap gap-2">
                    {Object.values(results).map((result, index) => (
                      result.pattern && (
                        <div key={index} className="flex items-center gap-2">
                          <Badge variant="outline">
                            "{result.pattern}": {result.matches?.length || 0} matches
                          </Badge>
                          {result.time && (
                            <Badge variant="secondary">
                              {result.time.toFixed(2)}ms
                            </Badge>
                          )}
                        </div>
                      )
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Panel */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  {getChartData().length > 0 ? (
                    <div className="space-y-6">
                      {/* Runtime Chart */}
                      <div>
                        <h4 className="text-sm font-medium mb-3">Execution Time (ms)</h4>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={getChartData()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="algorithm" />
                            <YAxis />
                            <RechartsTooltip />
                            <Bar dataKey="time" fill="hsl(var(--primary))" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Comparison Chart */}
                      <div>
                        <h4 className="text-sm font-medium mb-3">Comparisons Made</h4>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={getChartData()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="algorithm" />
                            <YAxis />
                            <RechartsTooltip />
                            <Bar dataKey="comparisons" fill="hsl(var(--accent))" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Summary Stats */}
                      <div className="space-y-3">
                        {getChartData().map((data, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                            <span className="text-sm font-medium">{data.algorithm}</span>
                            <div className="text-right text-xs text-muted-foreground">
                              <div>{data.time.toFixed(2)}ms</div>
                              <div>{data.comparisons} comparisons</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      Run algorithms to see performance metrics
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}