import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar, Check, Info } from "lucide-react";
import type { DistributionPreview } from "@/lib/gsc-distribution-engine";

interface GSCDistributionPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview: DistributionPreview | null;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function GSCDistributionPreviewDialog({
  open,
  onOpenChange,
  preview,
  onConfirm,
  isLoading = false,
}: GSCDistributionPreviewDialogProps) {
  if (!preview) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Distribution Preview</DialogTitle>
          <DialogDescription>
            Review how {preview.totalUrls} URLs will be distributed across your integrations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Summary */}
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Distribution Summary
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-sm text-blue-800 dark:text-blue-200 mt-2">
                    <div>
                      <p className="font-medium">{preview.summary.todayUrls}</p>
                      <p className="text-xs">Today</p>
                    </div>
                    <div>
                      <p className="font-medium">{preview.summary.futureUrls}</p>
                      <p className="text-xs">Future days</p>
                    </div>
                    <div>
                      <p className="font-medium">{preview.summary.accountsUsed}</p>
                      <p className="text-xs">Accounts used</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily breakdown */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Daily Distribution Plan
            </h4>
            
            {preview.distributionByDay.map((day, dayIdx) => (
              <Card key={dayIdx}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {day.day === 0 ? 'Today' : `Day ${day.day}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(day.date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{day.totalUrls}</p>
                        <p className="text-xs text-muted-foreground">URLs</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {day.accounts.map((account, accIdx) => (
                        <div 
                          key={accIdx}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{account.name}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-xs">
                              {account.email}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {account.urls} URLs
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {account.percentage.toFixed(0)}% of capacity
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>Processing...</>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Confirm Distribution
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
