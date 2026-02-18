import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search, Lightbulb, AlertCircle } from 'lucide-react';
import { bestPracticesContent, type BestPracticeEntry } from './bestPracticesContent';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BestPracticesSectionProps {
  failureReason?: string;
  diagnosticData?: string;
}

export default function BestPracticesSection({ failureReason, diagnosticData }: BestPracticesSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'Connectivity', 'Provider', 'Mempool', 'Network'];

  // Auto-suggest relevant entries based on failure reason and diagnostic data
  const suggestedEntries = useMemo(() => {
    if (!failureReason && !diagnosticData) return [];

    const searchText = `${failureReason || ''} ${diagnosticData || ''}`.toLowerCase();
    
    return bestPracticesContent.filter(entry => {
      return entry.keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
    });
  }, [failureReason, diagnosticData]);

  // Filter entries based on search and category
  const filteredEntries = useMemo(() => {
    let entries = bestPracticesContent;

    if (selectedCategory !== 'all') {
      entries = entries.filter(entry => entry.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      entries = entries.filter(entry => {
        return (
          entry.title.toLowerCase().includes(query) ||
          entry.body.toLowerCase().includes(query) ||
          entry.keywords.some(keyword => keyword.toLowerCase().includes(query))
        );
      });
    }

    return entries;
  }, [searchQuery, selectedCategory]);

  const renderEntry = (entry: BestPracticeEntry) => (
    <AccordionItem key={entry.id} value={entry.id}>
      <AccordionTrigger className="text-left">
        <div className="flex items-start gap-2 flex-1">
          <Lightbulb className="h-4 w-4 text-chart-1 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">{entry.title}</p>
            <Badge variant="outline" className="mt-1 text-xs">
              {entry.category}
            </Badge>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="pl-6 prose prose-sm max-w-none dark:prose-invert">
          <div
            className="text-sm text-muted-foreground whitespace-pre-wrap"
            dangerouslySetInnerHTML={{
              __html: entry.body
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">$1</code>')
                .replace(/\n/g, '<br />'),
            }}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );

  return (
    <Card className="financial-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-chart-1" />
          Best Practices & Troubleshooting Guide
        </CardTitle>
        <CardDescription>
          Searchable guidance for resolving common transfer issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestedEntries.length > 0 && (
          <Alert className="border-chart-1 bg-chart-1/10">
            <AlertCircle className="h-4 w-4 text-chart-1" />
            <AlertDescription className="text-chart-1">
              <strong>Suggested Topics</strong>
              <br />
              <span className="text-sm text-muted-foreground">
                Based on the failure reason and diagnostic data, these topics may be relevant:
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestedEntries.map(entry => (
                  <Badge key={entry.id} variant="secondary" className="text-xs">
                    {entry.title}
                  </Badge>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search best practices (e.g., 'localhost', 'timeout', 'mempool')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-5">
            {categories.map(cat => (
              <TabsTrigger key={cat} value={cat} className="text-xs">
                {cat === 'all' ? 'All' : cat}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-4">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No results found. Try a different search term or category.</p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {suggestedEntries.length > 0 && selectedCategory === 'all' && !searchQuery && (
                  <>
                    <div className="text-xs font-semibold text-chart-1 mb-2 px-1">
                      SUGGESTED FOR THIS ISSUE
                    </div>
                    {suggestedEntries.map(renderEntry)}
                    <div className="text-xs font-semibold text-muted-foreground mt-6 mb-2 px-1">
                      ALL TOPICS
                    </div>
                  </>
                )}
                {filteredEntries
                  .filter(entry => !suggestedEntries.includes(entry) || selectedCategory !== 'all' || searchQuery)
                  .map(renderEntry)}
              </Accordion>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
