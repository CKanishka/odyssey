import { useState, useEffect } from "react";
import { Copy, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { api } from "../lib/api";
import { Share } from "../types";

interface ShareModalProps {
  presentationId: string;
  currentSlideId: string | null;
  onClose: () => void;
}

export default function ShareModal({
  presentationId,
  currentSlideId,
  onClose,
}: ShareModalProps) {
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    loadShares();
  }, [presentationId]);

  const loadShares = async () => {
    try {
      const data = await api.getPresentationShares(presentationId);
      setShares(data);
    } catch (error) {
      console.error("Error loading shares:", error);
    }
  };

  const createShareLink = async (type: "PRESENTATION" | "SLIDE") => {
    setLoading(true);
    try {
      const share = await api.createShare(
        presentationId,
        type === "SLIDE" ? currentSlideId || undefined : undefined,
        type
      );
      setShares([...shares, share]);
    } catch (error) {
      console.error("Error creating share:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteShare = async (shareId: string) => {
    try {
      await api.deleteShare(shareId);
      setShares(shares.filter((s) => s.id !== shareId));
    } catch (error) {
      console.error("Error deleting share:", error);
    }
  };

  const copyToClipboard = (shareId: string) => {
    const url = `${window.location.origin}/share/${shareId}`;
    navigator.clipboard.writeText(url);
    setCopied(shareId);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent
        onClose={onClose}
        className="max-w-2xl max-h-[80vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">Share Presentation</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create new share */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Create Share Link</h3>
            <div className="flex space-x-3">
              <Button
                onClick={() => createShareLink("PRESENTATION")}
                disabled={loading}
                className="flex-1"
              >
                Share All Slides
              </Button>
              <Button
                onClick={() => createShareLink("SLIDE")}
                disabled={loading || !currentSlideId}
                variant="secondary"
                className="flex-1"
              >
                Share Current Slide
              </Button>
            </div>
          </div>

          {/* Existing shares */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">
              Existing Share Links
            </h3>
            {shares.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No share links created yet.
              </p>
            ) : (
              <div className="space-y-2">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-3 bg-accent/50 rounded-lg border border-border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            share.type === "PRESENTATION"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {share.type === "PRESENTATION"
                            ? "All Slides"
                            : "Single Slide"}
                        </Badge>
                        <span className="text-sm text-muted-foreground truncate">
                          {window.location.origin}/share/{share.shareId}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        onClick={() => copyToClipboard(share.shareId)}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="mr-2 h-3 w-3" />
                        {copied === share.shareId ? "Copied!" : "Copy"}
                      </Button>
                      <Button
                        onClick={() => deleteShare(share.id)}
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
