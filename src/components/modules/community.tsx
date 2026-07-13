'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Heart,
  MessageCircle,
  Plus,
  TrendingUp,
  Trophy,
  Award,
  Star,
  Shield,
  Eye,
  EyeOff,
  Filter,
  Flame,
  Target,
  CheckCircle2,
  ArrowRight,
  Crown,
  Zap,
  BookOpen,
  HandHeart,
  Sparkles,
  Send,
  X,
  ChevronRight,
  UserCircle,
  Hash,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

// ─── Types ────────────────────────────────────────────────────────

type Category = 'General' | 'PCOS' | 'Fertility' | 'Pregnancy' | 'Menopause' | 'Mental Health'

interface Post {
  id: string
  username: string
  title: string
  content: string
  category: Category
  likes: number
  comments: number
  timeAgo: string
  liked: boolean
}

interface TrendingTopic {
  id: string
  topic: string
  posts: number
  trending: boolean
}

interface SupportGroup {
  id: string
  name: string
  description: string
  members: number
  icon: React.ElementType
  color: string
  joined: boolean
}

interface Challenge {
  id: string
  name: string
  description: string
  participants: number
  progress: number
  daysLeft: number
  joined: boolean
}

interface Badge_ {
  id: string
  name: string
  description: string
  icon: React.ElementType
  earned: boolean
  color: string
}

// ─── Data ─────────────────────────────────────────────────────────
// NOTE: Demo / placeholder entries were removed so brand-new users start with
// empty states. The arrays below are intentionally empty. As real community
// content arrives (user-generated posts, server-side challenges, earned
// badges), populate them from the API / store instead of hardcoding here.

const categories: Category[] = ['General', 'PCOS', 'Fertility', 'Pregnancy', 'Menopause', 'Mental Health']

const categoryColors: Record<Category, string> = {
  General: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  PCOS: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  Fertility: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Pregnancy: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  Menopause: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'Mental Health': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
}

// Empty arrays — no demo posts, groups, challenges, or pre-earned badges.
const initialPosts: Post[] = []
const trendingTopics: TrendingTopic[] = []
const initialSupportGroups: SupportGroup[] = []
const initialChallenges: Challenge[] = []
const userBadges: Badge_[] = [
  { id: '1', name: 'First Post', description: 'Created your first post', icon: Send, earned: false, color: 'text-sky-500' },
  { id: '2', name: 'Helpful', description: 'Received 10+ likes on a comment', icon: HandHeart, earned: false, color: 'text-emerald-500' },
  { id: '3', name: 'Supportive', description: 'Commented on 25+ posts', icon: Heart, earned: false, color: 'text-pink-500' },
  { id: '4', name: 'Challenger', description: 'Completed a community challenge', icon: Trophy, earned: false, color: 'text-amber-500' },
  { id: '5', name: 'Rising Star', description: 'Get 50+ likes on a post', icon: Star, earned: false, color: 'text-purple-500' },
  { id: '6', name: 'Mentor', description: 'Help 100 community members', icon: Crown, earned: false, color: 'text-orange-500' },
]

// ─── Component ────────────────────────────────────────────────────

export default function CommunityModule() {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All')
  const [supportGroups, setSupportGroups] = useState<SupportGroup[]>(initialSupportGroups)
  const [challenges, setChallenges] = useState<Challenge[]>(initialChallenges)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'General' as Category,
    anonymous: true,
  })
  const [activeTab, setActiveTab] = useState<'feed' | 'groups' | 'challenges'>('feed')

  // A brand-new user starts at Level 1 with 0 support points and no progress
  // toward the next level. These values are derived from real community
  // activity (posts, likes, comments) once that data exists — not hardcoded.
  const supportScore = 0
  const nextLevel = 100
  const level = 1

  const filteredPosts = activeCategory === 'All'
    ? posts
    : posts.filter(p => p.category === activeCategory)

  const generateAnonName = () => {
    const flowers = ['Lotus', 'Sakhi', 'Amber', 'River', 'Jasmine', 'Peony', 'Rose', 'Lily', 'Daisy', 'Iris']
    const flower = flowers[Math.floor(Math.random() * flowers.length)]
    const num = Math.floor(Math.random() * 100)
    return `${flower}_${num}`
  }

  const handleCreatePost = () => {
    if (!newPost.title.trim() || !newPost.content.trim()) return
    const post: Post = {
      id: Date.now().toString(),
      username: newPost.anonymous ? generateAnonName() : 'You',
      title: newPost.title,
      content: newPost.content,
      category: newPost.category,
      likes: 0,
      comments: 0,
      timeAgo: 'Just now',
      liked: false,
    }
    setPosts([post, ...posts])
    setNewPost({ title: '', content: '', category: 'General', anonymous: true })
    setDialogOpen(false)
  }

  const toggleLike = (postId: string) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    )
  }

  const toggleGroup = (groupId: string) => {
    setSupportGroups(prev =>
      prev.map(g =>
        g.id === groupId
          ? {
              ...g,
              joined: !g.joined,
              members: g.joined ? g.members - 1 : g.members + 1,
            }
          : g
      )
    )
  }

  const toggleChallenge = (challengeId: string) => {
    setChallenges(prev =>
      prev.map(c =>
        c.id === challengeId
          ? {
              ...c,
              joined: !c.joined,
              participants: c.joined ? c.participants - 1 : c.participants + 1,
            }
          : c
      )
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-7 w-7 text-sky-500" />
            Community
          </h1>
          <p className="text-muted-foreground mt-1">Connect, share, and support each other</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-sky-500 hover:bg-sky-600 text-white">
              <Plus className="h-4 w-4 mr-1.5" /> Create Post
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create a Post</DialogTitle>
              <DialogDescription>Share your thoughts with the community</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-sm">Title</Label>
                <Input
                  placeholder="What's on your mind?"
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Content</Label>
                <Textarea
                  placeholder="Share your experience, ask a question, or offer support..."
                  rows={4}
                  value={newPost.content}
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Category</Label>
                <Select
                  value={newPost.category}
                  onValueChange={(v) => setNewPost(prev => ({ ...prev, category: v as Category }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {newPost.anonymous ? <EyeOff className="h-4 w-4 text-sky-500" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  <Label className="text-sm">Post anonymously</Label>
                </div>
                <Switch
                  checked={newPost.anonymous}
                  onCheckedChange={(v) => setNewPost(prev => ({ ...prev, anonymous: v }))}
                />
              </div>
              {newPost.anonymous && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Your username will appear as a random flower name like &quot;Lotus_42&quot;
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleCreatePost}
                  className="bg-sky-500 hover:bg-sky-600 text-white"
                  disabled={!newPost.title.trim() || !newPost.content.trim()}
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" /> Post
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Gamification Bar */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="border-sky-200 dark:border-sky-900/50 bg-gradient-to-r from-sky-50/80 to-blue-50/80 dark:from-sky-950/20 dark:to-blue-950/20">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {level}
                </div>
                <div>
                  <p className="font-semibold text-sm">Level {level} — Newcomer</p>
                  <p className="text-xs text-muted-foreground">{supportScore} / {nextLevel} points to Level {level + 1}</p>
                </div>
              </div>
              <div className="flex-1 w-full sm:w-auto">
                <Progress value={(supportScore / nextLevel) * 100} className="h-2.5" />
              </div>
              <div className="flex items-center gap-1.5">
                {userBadges.filter(b => b.earned).map(badge => {
                  const Icon = badge.icon
                  return (
                    <div
                      key={badge.id}
                      className="h-8 w-8 rounded-full bg-white dark:bg-card border border-sky-200 dark:border-sky-800 flex items-center justify-center shadow-sm"
                      title={`${badge.name}: ${badge.description}`}
                    >
                      <Icon className={`h-4 w-4 ${badge.color}`} />
                    </div>
                  )
                })}
                <div className="h-8 w-8 rounded-full bg-muted border border-dashed border-muted-foreground/30 flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground font-medium">+{userBadges.filter(b => !b.earned).length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {[
          { key: 'feed' as const, label: 'Feed', icon: MessageCircle },
          { key: 'groups' as const, label: 'Groups', icon: Users },
          { key: 'challenges' as const, label: 'Challenges', icon: Trophy },
        ].map(tab => (
          <Button
            key={tab.key}
            size="sm"
            variant={activeTab === tab.key ? 'default' : 'ghost'}
            className={`text-xs px-4 ${activeTab === tab.key ? 'bg-sky-500 hover:bg-sky-600 text-white' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <tab.icon className="h-3.5 w-3.5 mr-1.5" />
            {tab.label}
          </Button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'feed' && (
          <motion.div
            key="feed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Feed Column */}
            <div className="lg:col-span-2 space-y-4">
              {/* Category Filters */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                <Button
                  size="sm"
                  variant={activeCategory === 'All' ? 'default' : 'outline'}
                  className={`text-xs shrink-0 ${activeCategory === 'All' ? 'bg-sky-500 hover:bg-sky-600 text-white' : ''}`}
                  onClick={() => setActiveCategory('All')}
                >
                  <Filter className="h-3 w-3 mr-1" /> All
                </Button>
                {categories.map(cat => (
                  <Button
                    key={cat}
                    size="sm"
                    variant={activeCategory === cat ? 'default' : 'outline'}
                    className={`text-xs shrink-0 ${activeCategory === cat ? 'bg-sky-500 hover:bg-sky-600 text-white' : ''}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    <Hash className="h-3 w-3 mr-1" />
                    {cat}
                  </Button>
                ))}
              </div>

              {/* Posts */}
              {filteredPosts.length === 0 ? (
                <Card className="border-dashed border-sky-200 dark:border-sky-900/50">
                  <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-950/40 mb-3">
                      <MessageCircle className="h-6 w-6 text-sky-500" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Be the first to post</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                      Share a question, story, or encouragement. The community grows when you take the first step.
                    </p>
                    <Button
                      size="sm"
                      className="mt-4 bg-sky-500 hover:bg-sky-600 text-white"
                      onClick={() => setDialogOpen(true)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" /> Create the first post
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="max-h-[600px]">
                  <div className="space-y-3">
                    {filteredPosts.map((post, idx) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                      >
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="py-4">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-9 w-9 shrink-0">
                                <AvatarFallback className="bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300 text-xs font-semibold">
                                  {post.username.split('_')[0][0]}{post.username.split('_')[1]?.[0] || ''}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-semibold">{post.username}</span>
                                  <Badge
                                    variant="secondary"
                                    className={`text-[10px] border-0 ${categoryColors[post.category]}`}
                                  >
                                    {post.category}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground">{post.timeAgo}</span>
                                </div>
                                <h3 className="font-semibold text-sm mt-1 leading-snug">{post.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{post.content}</p>
                                <div className="flex items-center gap-4 mt-3">
                                  <button
                                    onClick={() => toggleLike(post.id)}
                                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-sky-500 transition-colors h-9 px-1 -mx-1 rounded-md"
                                  >
                                    <Heart
                                      className={`h-3.5 w-3.5 ${post.liked ? 'fill-sky-500 text-sky-500' : ''}`}
                                    />
                                    {post.likes}
                                  </button>
                                  <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-sky-500 transition-colors h-9 px-1 -mx-1 rounded-md">
                                    <MessageCircle className="h-3.5 w-3.5" />
                                    {post.comments}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Trending Topics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-sky-500" />
                    Trending Topics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {trendingTopics.length === 0 ? (
                    <div className="py-3 text-center">
                      <p className="text-xs text-muted-foreground">
                        No trending topics yet. As the community grows, popular topics will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {trendingTopics.map((topic, idx) => (
                        <motion.div
                          key={topic.id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + idx * 0.04 }}
                          className="flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-muted-foreground w-5">{idx + 1}</span>
                            <div>
                              <p className="text-sm font-medium group-hover:text-sky-500 transition-colors">{topic.topic}</p>
                              <p className="text-[10px] text-muted-foreground">{topic.posts} posts</p>
                            </div>
                          </div>
                          {topic.trending && (
                            <Flame className="h-3.5 w-3.5 text-orange-500" />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Badges */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-4 w-4 text-sky-500" />
                    Your Badges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {userBadges.map(badge => {
                      const Icon = badge.icon
                      return (
                        <div
                          key={badge.id}
                          className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border ${
                            badge.earned
                              ? 'border-sky-200 bg-sky-50/50 dark:border-sky-800 dark:bg-sky-950/20'
                              : 'border-dashed border-muted-foreground/20 opacity-50'
                          }`}
                          title={badge.description}
                        >
                          <Icon className={`h-5 w-5 ${badge.earned ? badge.color : 'text-muted-foreground'}`} />
                          <span className="text-[9px] text-center font-medium leading-tight">{badge.name}</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {activeTab === 'groups' && (
          <motion.div
            key="groups"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {supportGroups.length === 0 ? (
              <Card className="border-dashed border-sky-200 dark:border-sky-900/50">
                <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-950/40 mb-3">
                    <Users className="h-6 w-6 text-sky-500" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No support groups yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Support groups will appear here as they become available. In the meantime, head to the feed to connect with the community.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4 border-sky-200 text-sky-600 dark:border-sky-800 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30"
                    onClick={() => setActiveTab('feed')}
                  >
                    Browse the feed
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {supportGroups.map((group, idx) => {
                  const Icon = group.icon
                  return (
                    <motion.div
                      key={group.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.06 }}
                    >
                      <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
                        <CardHeader>
                          <div className="flex items-start gap-3">
                            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${group.color} shadow-lg`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-sm">{group.name}</CardTitle>
                              <CardDescription className="text-xs mt-0.5">{group.description}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="mt-auto">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <UserCircle className="h-3.5 w-3.5" />
                              {group.members.toLocaleString()} members
                            </div>
                            <Button
                              size="sm"
                              variant={group.joined ? 'outline' : 'default'}
                              className={`text-xs h-8 ${
                                group.joined
                                  ? 'border-sky-200 text-sky-600 dark:border-sky-800 dark:text-sky-400'
                                  : 'bg-sky-500 hover:bg-sky-600 text-white'
                              }`}
                              onClick={() => toggleGroup(group.id)}
                            >
                              {group.joined ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3 mr-1" /> Joined
                                </>
                              ) : (
                                <>
                                  <Plus className="h-3 w-3 mr-1" /> Join
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'challenges' && (
          <motion.div
            key="challenges"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {challenges.length === 0 ? (
              <Card className="border-dashed border-sky-200 dark:border-sky-900/50">
                <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-950/40 mb-3">
                    <Trophy className="h-6 w-6 text-sky-500" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No challenges yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Community challenges will appear here when they launch. Check back soon for goals you can join.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {challenges.map((challenge, idx) => (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="py-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2 rounded-xl ${
                              challenge.joined
                                ? 'bg-gradient-to-br from-sky-500 to-blue-600'
                                : 'bg-muted'
                            }`}>
                              <Trophy className={`h-5 w-5 ${challenge.joined ? 'text-white' : 'text-muted-foreground'}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-sm">{challenge.name}</h3>
                                <Badge variant="secondary" className="text-[10px] border-0 bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                                  <Zap className="h-2.5 w-2.5 mr-0.5" /> Active
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{challenge.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {challenge.participants} participants
                                </span>
                                <span className="flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  {challenge.daysLeft} days left
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="sm:w-48 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-semibold text-sky-500">{challenge.progress}%</span>
                            </div>
                            <Progress value={challenge.progress} className="h-2" />
                            <Button
                              size="sm"
                              variant={challenge.joined ? 'outline' : 'default'}
                              className={`w-full text-xs h-8 ${
                                challenge.joined
                                  ? 'border-sky-200 text-sky-600 dark:border-sky-800 dark:text-sky-400'
                                  : 'bg-sky-500 hover:bg-sky-600 text-white'
                              }`}
                              onClick={() => toggleChallenge(challenge.id)}
                            >
                              {challenge.joined ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Joined
                              </>
                            ) : (
                              <>
                                <ArrowRight className="h-3 w-3 mr-1" /> Join Challenge
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
