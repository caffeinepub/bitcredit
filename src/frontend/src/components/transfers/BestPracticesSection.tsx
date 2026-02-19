import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, ChevronDown, ChevronUp, Lightbulb, Filter } from 'lucide-react';
import { bestPracticesContent, type BestPracticeEntry } from './bestPracticesContent';

interface BestPracticesSectionProps {
  request?: any;
}

export default function BestPracticesSection({ request }: BestPracticesSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedEntries, setExpandedEntries] = useState<{ [key: string]: boolean }>({});

  // Auto-suggest topics based on transfer failure patterns
  const suggestedTopics = useMemo(() => {
    if (!request) return [];

    const suggestions: string[] = [];
    const failureReason = request.failureReason?.toLowerCase() || '';
    const diagnosticData = request.diagnosticData?.toLowerCase() || '';

    // Check for localhost/connectivity issues
    if (failureReason.includes('localhost') || 
        failureReason.includes('127.0.0.1') ||
        diagnosticData.includes('localhost')) {
      suggestions.push('localhost-not-accessible');
    }

    // Check for provider timeout
    if (failureReason.includes('timeout') || 
        diagnosticData.includes('timeout')) {
      suggestions.push('provider-timeout');
    }

    // Check for address format issues
    if (failureReason.includes('address') || 
        failureReason.includes('invalid') ||
        failureReason.includes('format')) {
      suggestions.push('wrong-network');
    }

    // Check for connection errors
    if (failureReason.includes('connect') || 
        failureReason.includes('connection') ||
        diagnosticData.includes('connect')) {
      suggestions.push('provider-timeout');
    }

    return suggestions;
  }, [request]);

  // Filter entries based on search and category
  const filteredEntries = useMemo(() => {
    let entries = bestPracticesContent;

    // Filter by category
    if (selectedCategory) {
      entries = entries.filter(entry => entry.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      entries = entries.filter(entry =>
        entry.title.toLowerCase().includes(query) ||
        entry.body.toLowerCase().includes(query) ||
        entry.keywords.some(keyword => keyword.toLowerCase().includes(query))
      );
    }

    return entries;
  }, [searchQuery, selectedCategory]);

  // Get suggested entries
  const suggestedEntries = useMemo(() => {
    return bestPracticesContent.filter(entry => suggestedTopics.includes(entry.id));
  }, [suggestedTopics]);

  const toggleEntry = (id: string) => {
    setExpandedEntries(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const categories = Array.from(new Set(bestPracticesContent.map(entry => entry.category)));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Best Practices & Troubleshooting Guide
        </CardTitle>
        <CardDescription>
          Common issues and solutions for Bitcoin transfer problems
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search troubleshooting topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              <Filter className="h-3 w-3 mr-1" />
              All
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Auto-Suggested Topics */}
        {suggestedEntries.length > 0 && !searchQuery && !selectedCategory && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-600" />
              <h4 className="font-semibold text-sm">Suggested Topics Based on This Transfer</h4>
            </div>
            <div className="space-y-2">
              {suggestedEntries.map(entry => (
                <Collapsible key={entry.id} open={expandedEntries[entry.id]}>
                  <div className="border border-amber-500 bg-amber-50 dark:bg-amber-950 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-semibold text-sm">{entry.title}</h5>
                          <Badge variant="outline" className="text-xs">{entry.category}</Badge>
                        </div>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleEntry(entry.id)}
                        >
                          {expandedEntries[entry.id] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent>
                      <div className="mt-3 pt-3 border-t border-amber-300 dark:border-amber-800 prose prose-sm max-w-none dark:prose-invert">
                        <div dangerouslySetInnerHTML={{ __html: entry.body.replace(/\n/g, '<br />') }} />
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          </div>
        )}

        {/* All Entries */}
        <div className="space-y-2">
          {!searchQuery && !selectedCategory && suggestedEntries.length > 0 && (
            <h4 className="font-semibold text-sm mt-6">All Topics</h4>
          )}
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No troubleshooting topics found matching your search.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEntries.map(entry => (
                <Collapsible key={entry.id} open={expandedEntries[entry.id]}>
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-semibold text-sm">{entry.title}</h5>
                          <Badge variant="outline" className="text-xs">{entry.category}</Badge>
                        </div>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleEntry(entry.id)}
                        >
                          {expandedEntries[entry.id] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent>
                      <div className="mt-3 pt-3 border-t prose prose-sm max-w-none dark:prose-invert">
                        <div dangerouslySetInnerHTML={{ __html: entry.body.replace(/\n/g, '<br />') }} />
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
