import { useState, useEffect } from "react";
import { Copy, Trash2, Link2 } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { RadioOption } from "./ui/radio-option";
import { api } from "../lib/api";
import { Share } from "../types";
import { toast } from "sonner";

interface ShareModalProps {
  presentationId: string;
  currentSlideId: string | null;
  onClose: () => void;
}

const getShareUrl = (presentationId: string, shareId: string) => {
  return `${window.location.origin}/presentation/${presentationId}?share=${shareId}`;
};

export default function ShareModal({
  presentationId,
  currentSlideId,
  onClose,
}: ShareModalProps) {
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedPermission, setSelectedPermission] = useState<"edit" | "view">(
    "edit"
  );
  const [selectedType, setSelectedType] = useState<"PRESENTATION" | "SLIDE">(
    "PRESENTATION"
  );

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

  const copyToClipboard = (shareId: string) => {
    const url = getShareUrl(presentationId, shareId);
    navigator.clipboard.writeText(url);
    setCopied(shareId);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Link copied to clipboard!");
  };

  const generateShareLink = async () => {
    setLoading(true);
    try {
      const share = await api.createShare(
        presentationId,
        selectedType === "SLIDE" ? currentSlideId || undefined : undefined,
        selectedType,
        selectedPermission
      );
      setShares([...shares, share]);
      const shareUrl = getShareUrl(presentationId, share.shareId);
      toast.success(
        <div className="flex flex-col gap-2 w-full">
          <div className="font-semibold">Share link generated!</div>
          <div className="text-sm break-all bg-muted p-2 rounded">
            {shareUrl}
          </div>
        </div>,
        {
          duration: 10000,
          action: {
            label: "Copy",
            onClick: () => copyToClipboard(share.shareId),
          },
        }
      );
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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent
        onClose={onClose}
        className="max-w-2xl max-h-[80vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg text-foreground">
                Share Presentation
              </h3>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Form to generate new share link */}
          <div className="border border-border rounded-lg p-5 bg-accent/20 space-y-4">
            {/* What to share */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                What would you like to share?
              </label>
              <div className="space-y-2">
                <RadioOption
                  name="shareType"
                  value="PRESENTATION"
                  checked={selectedType === "PRESENTATION"}
                  onChange={() => setSelectedType("PRESENTATION")}
                  title="All Slides"
                />
                <RadioOption
                  name="shareType"
                  value="SLIDE"
                  checked={selectedType === "SLIDE"}
                  onChange={() => setSelectedType("SLIDE")}
                  disabled={!currentSlideId}
                  title="Current Slide Only"
                />
              </div>
            </div>

            {/* Permission level */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Permission Level
              </label>
              <div className="space-y-2">
                <RadioOption
                  name="permission"
                  value="edit"
                  checked={selectedPermission === "edit"}
                  onChange={() => setSelectedPermission("edit")}
                  title="Can Edit"
                  description="Recipients can view and edit the presentation"
                />
                <RadioOption
                  name="permission"
                  value="view"
                  checked={selectedPermission === "view"}
                  onChange={() => setSelectedPermission("view")}
                  title="View Only"
                  description="Recipients can only view the presentation"
                />
              </div>
            </div>

            {/* Generate button */}
            <Button
              onClick={generateShareLink}
              disabled={
                loading || (selectedType === "SLIDE" && !currentSlideId)
              }
              className="w-full h-11 text-base font-medium"
              size="lg"
            >
              <Link2 className="mr-2 h-5 w-5" />
              {loading ? "Generating..." : "Generate Share Link"}
            </Button>
          </div>

          {/* Existing shares */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">
              Existing Share Links
            </h3>
            {shares.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No share links created yet. Generate one above to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-3 bg-accent/50 rounded-lg border border-border"
                  >
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center flex-wrap gap-1">
                        <Badge variant="outline">
                          {share.type === "PRESENTATION"
                            ? "All Slides"
                            : "Single Slide"}
                        </Badge>
                        <Badge variant="outline">
                          {share.permission === "edit"
                            ? "Can Edit"
                            : "View Only"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground truncate max-w-[400px]">
                        {window.location.origin}/presentation/{presentationId}
                        ?share={share.shareId}
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
