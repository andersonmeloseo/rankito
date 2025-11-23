import { useState } from "react";
import { useGBPProfilePosts } from "@/hooks/useGBPProfilePosts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Trash2, Edit, Loader2, Image as ImageIcon } from "lucide-react";
import { GBPImageUploader } from "./GBPImageUploader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface GBPProfilePostsManagerProps {
  profileId: string;
}

export const GBPProfilePostsManager = ({ profileId }: GBPProfilePostsManagerProps) => {
  const { posts, isLoading, createPost, isCreating, deletePost, isDeleting } = useGBPProfilePosts(profileId);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    post_type: 'update',
    title: '',
    content: '',
    scheduled_for: '',
    media_urls: [] as string[],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const handleCreate = () => {
    createPost({
      ...formData,
      status: formData.scheduled_for ? 'scheduled' : 'draft',
    });
    setShowCreateDialog(false);
    setFormData({ post_type: 'update', title: '', content: '', scheduled_for: '', media_urls: [] });
  };

  const publishedPosts = posts?.filter(p => p.status === 'published') || [];
  const scheduledPosts = posts?.filter(p => p.status === 'scheduled') || [];
  const draftPosts = posts?.filter(p => p.status === 'draft') || [];

  const PostCard = ({ post }: { post: any }) => (
    <Card key={post.id}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                {post.status === 'published' ? 'Publicado' : post.status === 'scheduled' ? 'Agendado' : 'Rascunho'}
              </Badge>
              <Badge variant="outline">{post.post_type}</Badge>
            </div>
            {post.title && <h3 className="font-semibold mb-2">{post.title}</h3>}
            <p className="text-sm text-muted-foreground mb-3">{post.content}</p>
            
            {post.media_urls && post.media_urls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                {post.media_urls.slice(0, 6).map((url: string, idx: number) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Post image ${idx + 1}`}
                    className="w-full h-24 object-cover rounded-md border"
                  />
                ))}
                {post.media_urls.length > 6 && (
                  <div className="w-full h-24 rounded-md border bg-muted flex items-center justify-center">
                    <span className="text-sm text-muted-foreground">
                      +{post.media_urls.length - 6}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => deletePost(post.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {post.published_at && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Publicado: {format(new Date(post.published_at), 'dd/MM/yyyy HH:mm')}
            </div>
          )}
          {post.scheduled_for && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Agendado: {format(new Date(post.scheduled_for), 'dd/MM/yyyy HH:mm')}
            </div>
          )}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
              {post.media_urls.length} foto(s)
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Criar Post
        </Button>
      </div>

      <Tabs defaultValue="published" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
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
          {publishedPosts.map(post => <PostCard key={post.id} post={post} />)}
          {publishedPosts.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">Nenhum post publicado</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          {scheduledPosts.map(post => <PostCard key={post.id} post={post} />)}
          {scheduledPosts.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">Nenhum post agendado</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          {draftPosts.map(post => <PostCard key={post.id} post={post} />)}
          {draftPosts.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">Nenhum rascunho</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de Criação */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Post</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Post</Label>
              <Select
                value={formData.post_type}
                onValueChange={(value) => setFormData({ ...formData, post_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="update">Atualização</SelectItem>
                  <SelectItem value="event">Evento</SelectItem>
                  <SelectItem value="offer">Oferta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Título (opcional)</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Título do post..."
              />
            </div>

            <div className="space-y-2">
              <Label>Conteúdo</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Escreva o conteúdo do seu post..."
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label>Agendar Publicação (opcional)</Label>
              <Input
                type="datetime-local"
                value={formData.scheduled_for}
                onChange={(e) => setFormData({ ...formData, scheduled_for: e.target.value })}
              />
            </div>

            <GBPImageUploader
              onImagesChange={(urls) => setFormData({ ...formData, media_urls: urls })}
              existingUrls={formData.media_urls}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isCreating || !formData.content.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  {formData.scheduled_for ? 'Agendar' : 'Criar Rascunho'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
