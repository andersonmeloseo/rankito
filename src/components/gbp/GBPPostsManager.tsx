import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Calendar, ExternalLink } from "lucide-react";
import { useGBPPosts } from "@/hooks/useGBPPosts";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateGBPPostDialog } from "./CreateGBPPostDialog";

interface GBPPostsManagerProps {
  siteId: string;
}

export const GBPPostsManager = ({ siteId }: GBPPostsManagerProps) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { posts, isLoading, createPost, deletePost } = useGBPPosts(siteId, statusFilter);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="default">Publicado</Badge>;
      case 'scheduled':
        return <Badge variant="secondary">Agendado</Badge>;
      case 'draft':
        return <Badge variant="outline">Rascunho</Badge>;
      case 'failed':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const publishedPosts = posts?.filter(p => p.status === 'published') || [];
  const scheduledPosts = posts?.filter(p => p.status === 'scheduled') || [];
  const draftPosts = posts?.filter(p => p.status === 'draft') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gerenciar Posts</CardTitle>
              <CardDescription>
                Crie posts, ofertas e eventos para seu Google Business Profile
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Post
            </Button>
          </div>
        </CardHeader>
      </Card>

      <CreateGBPPostDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        siteId={siteId}
      />

      {/* Tabs for posts */}
      <Card>
        <CardHeader>
          <CardTitle>Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="published" onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="published">
                Publicados ({publishedPosts.length})
              </TabsTrigger>
              <TabsTrigger value="scheduled">
                Agendados ({scheduledPosts.length})
              </TabsTrigger>
              <TabsTrigger value="draft">
                Rascunhos ({draftPosts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="published" className="space-y-4">
              {publishedPosts.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <p className="text-center text-muted-foreground">Nenhum post publicado</p>
                  </CardContent>
                </Card>
              ) : (
                publishedPosts.map(post => (
                  <Card key={post.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          {post.title && <CardTitle className="text-lg">{post.title}</CardTitle>}
                          <p className="text-sm text-muted-foreground">{post.content}</p>
                          <div className="flex gap-2 items-center">
                            {getStatusBadge(post.status)}
                            <span className="text-xs text-muted-foreground">
                              {post.published_at && new Date(post.published_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePost(post.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    {post.cta_url && (
                      <CardContent>
                        <Button variant="outline" size="sm" asChild>
                          <a href={post.cta_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Ver Link
                          </a>
                        </Button>
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="scheduled" className="space-y-4">
              {scheduledPosts.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <p className="text-center text-muted-foreground">Nenhum post agendado</p>
                  </CardContent>
                </Card>
              ) : (
                scheduledPosts.map(post => (
                  <Card key={post.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          {post.title && <CardTitle className="text-lg">{post.title}</CardTitle>}
                          <p className="text-sm text-muted-foreground">{post.content}</p>
                          <div className="flex gap-2 items-center">
                            {getStatusBadge(post.status)}
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {post.scheduled_for && new Date(post.scheduled_for).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePost(post.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="draft" className="space-y-4">
              {draftPosts.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <p className="text-center text-muted-foreground">Nenhum rascunho</p>
                  </CardContent>
                </Card>
              ) : (
                draftPosts.map(post => (
                  <Card key={post.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          {post.title && <CardTitle className="text-lg">{post.title}</CardTitle>}
                          <p className="text-sm text-muted-foreground">{post.content}</p>
                          <div className="flex gap-2 items-center">
                            {getStatusBadge(post.status)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePost(post.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
