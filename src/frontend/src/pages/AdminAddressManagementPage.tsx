import { useState } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy, Search, ExternalLink, Key } from 'lucide-react';
import { useGetAllUserAddresses } from '../hooks/useQueries';
import { toast } from 'sonner';
import type { BitcoinAddress, UserAddressRecord } from '../backend';
import { Principal } from '@dfinity/principal';

export default function AdminAddressManagementPage() {
  const { data: allUserAddresses = [], isLoading } = useGetAllUserAddresses();
  const [searchQuery, setSearchQuery] = useState('');

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openBlockchainExplorer = (address: string) => {
    window.open(`https://blockchair.com/bitcoin/address/${address}`, '_blank');
  };

  // Calculate statistics
  const totalAddresses = allUserAddresses.reduce((sum, [_, record]) => sum + record.addresses.length, 0);
  const activeAddresses = allUserAddresses.filter(([_, record]) => record.primaryAddress !== null).length;
  const usedAddresses = totalAddresses - activeAddresses;
  const avgAddressesPerUser = allUserAddresses.length > 0 
    ? (totalAddresses / allUserAddresses.length).toFixed(2) 
    : '0';

  // Flatten all addresses with user info for searching
  const allAddresses: Array<{ principal: Principal; address: BitcoinAddress; isActive: boolean }> = [];
  allUserAddresses.forEach(([principal, record]) => {
    record.addresses.forEach(address => {
      allAddresses.push({
        principal,
        address,
        isActive: record.primaryAddress?.address === address.address
      });
    });
  });

  // Filter addresses based on search query
  const filteredAddresses = allAddresses.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.address.address.toLowerCase().includes(query) ||
      item.principal.toString().toLowerCase().includes(query)
    );
  });

  // Sort by creation date (newest first)
  const sortedAddresses = [...filteredAddresses].sort((a, b) => 
    Number(b.address.createdAt - a.address.createdAt)
  );

  return (
    <AppLayout>
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Key className="h-8 w-8" />
              Address Management
            </h1>
            <p className="text-muted-foreground">
              View and manage all user Bitcoin addresses across the platform
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Addresses</CardDescription>
                <CardTitle className="text-3xl">{totalAddresses}</CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Active Addresses</CardDescription>
                <CardTitle className="text-3xl text-green-600">{activeAddresses}</CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Used Addresses</CardDescription>
                <CardTitle className="text-3xl text-blue-600">{usedAddresses}</CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Avg per User</CardDescription>
                <CardTitle className="text-3xl">{avgAddressesPerUser}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Search and Filter */}
          <Card>
            <CardHeader>
              <CardTitle>Search Addresses</CardTitle>
              <CardDescription>
                Search by Bitcoin address or user principal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by address or principal..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Address Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Addresses ({sortedAddresses.length})</CardTitle>
              <CardDescription>
                Complete list of all Bitcoin addresses with metadata
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : sortedAddresses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {searchQuery ? 'No addresses found matching your search' : 'No addresses generated yet'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>User Principal</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Network</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedAddresses.map((item, index) => (
                        <TableRow key={`${item.principal.toString()}-${item.address.address}-${index}`}>
                          <TableCell>
                            {item.isActive ? (
                              <Badge className="bg-green-500 hover:bg-green-600 text-white">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Used</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-xs max-w-xs truncate">
                              {item.address.address}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-xs max-w-xs truncate">
                              {item.principal.toString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {item.address.addressType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {item.address.network}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(item.address.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy(item.address.address)}
                                title="Copy address"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy(item.principal.toString())}
                                title="Copy principal"
                              >
                                <Copy className="h-3 w-3 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openBlockchainExplorer(item.address.address)}
                                title="View on explorer"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
