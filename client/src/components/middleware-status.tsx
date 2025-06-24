import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield, Activity, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

interface MiddlewareStatusProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function MiddlewareStatus({ isVisible, onClose }: MiddlewareStatusProps) {
  const { data: status, isLoading } = useQuery({
    queryKey: ["/api/middleware/status"],
    refetchInterval: 5000,
    enabled: isVisible,
  });

  const { data: approvals = [] } = useQuery({
    queryKey: ["/api/middleware/approvals"],
    refetchInterval: 10000,
    enabled: isVisible,
  });

  const { data: auditStats } = useQuery({
    queryKey: ["/api/middleware/audit"],
    refetchInterval: 30000,
    enabled: isVisible,
  });

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90vh] rde-bg-secondary rounded-lg border rde-border flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b rde-border">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold rde-text-primary">Agent Bridge Middleware</h2>
              <p className="text-sm rde-text-secondary">AI Governance & Execution Control</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="hover:rde-bg-accent"
          >
            ×
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="rde-text-secondary">Loading middleware status...</p>
            </div>
          ) : (
            <>
              {/* Status Overview */}
              <Card className="rde-bg-primary rde-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>System Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                        (status as any)?.initialized ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <p className="text-xs rde-text-secondary">Initialized</p>
                    </div>
                    <div className="text-center">
                      <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                        (status as any)?.components?.intentParser ? 'bg-green-500' : 'bg-gray-500'
                      }`}></div>
                      <p className="text-xs rde-text-secondary">Intent Parser</p>
                    </div>
                    <div className="text-center">
                      <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                        (status as any)?.components?.governance ? 'bg-green-500' : 'bg-gray-500'
                      }`}></div>
                      <p className="text-xs rde-text-secondary">Governance</p>
                    </div>
                    <div className="text-center">
                      <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                        (status as any)?.components?.execution ? 'bg-green-500' : 'bg-gray-500'
                      }`}></div>
                      <p className="text-xs rde-text-secondary">Execution</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pending Approvals */}
              {Array.isArray(approvals) && approvals.length > 0 && (
                <Card className="rde-bg-primary rde-border">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-yellow-500" />
                      <span>Pending Approvals ({Array.isArray(approvals) ? approvals.length : 0})</span>
                    </CardTitle>
                    <CardDescription>
                      AI-generated intents requiring manual approval
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Array.isArray(approvals) && approvals.slice(0, 5).map((approval: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 rde-bg-accent rounded">
                          <div className="flex-1">
                            <p className="text-sm font-medium rde-text-primary">
                              {approval.intent.type.replace('_', ' ').toUpperCase()}
                            </p>
                            <p className="text-xs rde-text-secondary">
                              {approval.intent.id} • {new Date(approval.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => {
                                // Handle approval
                                apiRequest("POST", `/api/middleware/approve/${approval.intent.id}`, {});
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs"
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Audit Statistics */}
              {auditStats && (
                <Card className="rde-bg-primary rde-border">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="w-5 h-5" />
                      <span>7-Day Activity Summary</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-400">{(auditStats as any)?.totalIntents || 0}</p>
                        <p className="text-xs rde-text-secondary">Total Intents</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-400">{(auditStats as any)?.successfulExecutions || 0}</p>
                        <p className="text-xs rde-text-secondary">Successful</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-400">{(auditStats as any)?.rejectedIntents || 0}</p>
                        <p className="text-xs rde-text-secondary">Rejected</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-400">{(auditStats as any)?.pendingApprovals || 0}</p>
                        <p className="text-xs rde-text-secondary">Pending</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Intent Types Breakdown */}
              {(auditStats as any)?.intentTypeBreakdown && (
                <Card className="rde-bg-primary rde-border">
                  <CardHeader>
                    <CardTitle>Intent Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries((auditStats as any).intentTypeBreakdown).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm rde-text-primary capitalize">
                            {type.replace('_', ' ')}
                          </span>
                          <Badge variant="secondary" className="rde-bg-accent">
                            {count as number}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t rde-border">
          <div className="flex items-center justify-between text-xs rde-text-secondary">
            <span>Agent Bridge Middleware v2.0 - Live Governance Active</span>
            <span>
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}