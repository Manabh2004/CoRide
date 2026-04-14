import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, Modal, ScrollView,
  KeyboardAvoidingView, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../services/firebase';
import { colors, shared } from '../styles/theme';

const STORAGE_KEY = 'community_posts';

const DEFAULT_POSTS = [
  {
    id: 'default_1', author: 'Priya S.', area: 'Bhubaneswar North', time: '2h ago',
    content: 'Anyone going from Saheed Nagar to Infocity around 9am tomorrow? Looking for a carpool buddy 🙏',
    likes: [], comments: [
      { id: 'c1', author: 'Rahul M.', text: 'I go that route! Posting a ride now 🙌', time: '1h ago' },
    ],
  },
  {
    id: 'default_2', author: 'Rahul M.', area: 'Bhubaneswar North', time: '5h ago',
    content: 'Regular host here — going KIIT to Infocity every weekday at 8:30am. DM me if interested!',
    likes: ['user1', 'user2', 'user3'], comments: [],
  },
  {
    id: 'default_3', author: 'Sneha K.', area: 'Bhubaneswar North', time: '1d ago',
    content: 'Shoutout to Abhisek for the smooth ride this morning ⭐⭐⭐⭐⭐',
    likes: ['user1', 'user2'],
    comments: [
      { id: 'c2', author: 'Abhisek P.', text: 'Thank you! See you tomorrow 🚗', time: '23h ago' },
    ],
  },
];

export default function CommunityScreen() {
  const user = auth.currentUser;
  const userId = user?.uid || 'anon';
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  // Save posts to AsyncStorage whenever they change
  useEffect(() => {
    if (loaded) savePosts(posts);
  }, [posts]);

  const loadPosts = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPosts(JSON.parse(stored));
      } else {
        setPosts(DEFAULT_POSTS);
      }
    } catch (e) {
      setPosts(DEFAULT_POSTS);
    } finally {
      setLoaded(true);
    }
  };

  const savePosts = async (postsToSave) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(postsToSave));
    } catch (e) {}
  };

  const handlePost = () => {
    if (!newPost.trim()) return;
    const post = {
      id: Date.now().toString(),
      author: user?.displayName || 'You',
      area: 'Bhubaneswar North',
      time: 'Just now',
      content: newPost.trim(),
      likes: [],
      comments: [],
    };
    setPosts(prev => [post, ...prev]);
    setNewPost('');
  };

  const handleLike = (postId) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const likes = Array.isArray(p.likes) ? p.likes : [];
      if (likes.includes(userId)) {
        return { ...p, likes: likes.filter(id => id !== userId) };
      } else {
        return { ...p, likes: [...likes, userId] };
      }
    }));
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedPost) return;
    const comment = {
      id: Date.now().toString(),
      author: user?.displayName || 'You',
      text: newComment.trim(),
      time: 'Just now',
    };

    setPosts(prev => prev.map(p =>
      p.id === selectedPost.id
        ? { ...p, comments: [...p.comments, comment] }
        : p
    ));

    // Also update selectedPost so modal refreshes
    setSelectedPost(prev => ({ ...prev, comments: [...prev.comments, comment] }));
    setNewComment('');
  };

  const renderPost = ({ item }) => {
    const likes = Array.isArray(item.likes) ? item.likes : [];
    const liked = likes.includes(userId);
    return (
      <View style={[shared.card, { marginBottom: 12 }]}>
        <View style={styles.postHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.author[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.postAuthor}>{item.author}</Text>
            <Text style={styles.postMeta}>{item.area} · {item.time}</Text>
          </View>
        </View>

        <Text style={styles.postContent}>{item.content}</Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, liked && styles.actionBtnActive]}
            onPress={() => handleLike(item.id)}
          >
            <Text style={[styles.actionText, liked && styles.actionTextActive]}>
              👍 {likes.length}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setSelectedPost(item)}
          >
            <Text style={styles.actionText}>
              💬 {item.comments.length} {item.comments.length === 1 ? 'comment' : 'comments'}
            </Text>
          </TouchableOpacity>
        </View>

        {item.comments.length > 0 && (
          <TouchableOpacity
            style={styles.commentPreview}
            onPress={() => setSelectedPost(item)}
          >
            <Text style={styles.commentPreviewText}>
              <Text style={{ fontWeight: '600' }}>{item.comments[0].author}: </Text>
              {item.comments[0].text}
            </Text>
            {item.comments.length > 1 && (
              <Text style={styles.viewAll}>View all {item.comments.length} comments →</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.lightGray }}>
      <View style={styles.composeCard}>
        <TextInput
          style={styles.composeInput}
          placeholder="Share something with your area community..."
          value={newPost}
          onChangeText={setNewPost}
          multiline
        />
        <TouchableOpacity
          style={[shared.button, {
            backgroundColor: newPost.trim() ? colors.black : '#cccccc',
            marginBottom: 0,
          }]}
          onPress={handlePost}
          disabled={!newPost.trim()}
        >
          <Text style={[shared.buttonText, { color: colors.white }]}>Post</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={renderPost}
        contentContainerStyle={{ padding: 16 }}
      />

      {/* Comments modal */}
      <Modal
        visible={!!selectedPost}
        animationType="slide"
        onRequestClose={() => setSelectedPost(null)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: colors.white }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedPost(null)}>
              <Text style={styles.modalClose}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Comments</Text>
            <View style={{ width: 60 }} />
          </View>

          {selectedPost && (
            <>
              <View style={styles.originalPost}>
                <Text style={styles.postAuthor}>{selectedPost.author}</Text>
                <Text style={[styles.postContent, { marginBottom: 0 }]}>{selectedPost.content}</Text>
              </View>

              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
                {selectedPost.comments.length === 0 ? (
                  <Text style={styles.noComments}>No comments yet. Be the first!</Text>
                ) : (
                  selectedPost.comments.map(comment => (
                    <View key={comment.id} style={styles.commentItem}>
                      <View style={styles.commentAvatar}>
                        <Text style={styles.commentAvatarText}>{comment.author[0]}</Text>
                      </View>
                      <View style={styles.commentBubble}>
                        <Text style={styles.commentAuthor}>{comment.author}</Text>
                        <Text style={styles.commentText}>{comment.text}</Text>
                        <Text style={styles.commentTime}>{comment.time}</Text>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>

              <View style={styles.commentInput}>
                <TextInput
                  style={styles.commentTextInput}
                  placeholder="Write a comment..."
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.commentSendBtn, !newComment.trim() && { opacity: 0.4 }]}
                  onPress={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  <Text style={styles.commentSendText}>Send</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  composeCard: { backgroundColor: colors.white, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  composeInput: { borderWidth: 1, borderColor: colors.borderDark, borderRadius: 10, padding: 12, fontSize: 14, minHeight: 60, marginBottom: 10 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.black, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: colors.yellow, fontWeight: 'bold', fontSize: 16 },
  postAuthor: { fontSize: 14, fontWeight: 'bold', color: colors.black },
  postMeta: { fontSize: 11, color: colors.gray },
  postContent: { fontSize: 14, color: colors.text, lineHeight: 20, marginBottom: 12 },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.offWhite },
  actionBtnActive: { backgroundColor: '#EEF2FF', borderColor: '#6366F1' },
  actionText: { fontSize: 13, color: colors.gray },
  actionTextActive: { color: '#6366F1', fontWeight: '600' },
  commentPreview: { backgroundColor: colors.offWhite, borderRadius: 8, padding: 10, marginTop: 4 },
  commentPreviewText: { fontSize: 13, color: colors.text, lineHeight: 18 },
  viewAll: { fontSize: 12, color: colors.gray, marginTop: 4 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.white, paddingTop: 48 },
  modalClose: { fontSize: 15, color: colors.black, fontWeight: '600', width: 60 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: colors.black },
  originalPost: { padding: 16, backgroundColor: colors.offWhite, borderBottomWidth: 1, borderBottomColor: colors.border },
  noComments: { textAlign: 'center', color: colors.gray, marginTop: 40, fontSize: 14 },
  commentItem: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.black, justifyContent: 'center', alignItems: 'center' },
  commentAvatarText: { color: colors.yellow, fontWeight: 'bold', fontSize: 13 },
  commentBubble: { flex: 1, backgroundColor: colors.offWhite, borderRadius: 12, padding: 10 },
  commentAuthor: { fontSize: 13, fontWeight: '600', color: colors.black, marginBottom: 2 },
  commentText: { fontSize: 13, color: colors.text, lineHeight: 18 },
  commentTime: { fontSize: 10, color: colors.gray, marginTop: 4 },
  commentInput: { flexDirection: 'row', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.white, paddingBottom: 28 },
  commentTextInput: { flex: 1, borderWidth: 1, borderColor: colors.borderDark, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, maxHeight: 80 },
  commentSendBtn: { backgroundColor: colors.black, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, justifyContent: 'center' },
  commentSendText: { color: colors.white, fontWeight: 'bold', fontSize: 13 },
});