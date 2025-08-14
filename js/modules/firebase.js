// This module encapsulates all Firebase-related logic, including initialization and data operations.

// --- Initialization ---

const firebaseConfig = {
  apiKey: "AIzaSyCtYU-UlvsoDsNvtJ0mzJab6XcnztTwVBs",
  authDomain: "blog-15b04.firebaseapp.com",
  projectId: "blog-15b04",
  storageBucket: "blog-15b04.firebasestorage.app",
  messagingSenderId: "474408380613",
  appId: "1:474408380613:web:a8a530cd850fa4d6bde8ac",
  measurementId: "G-BR8LPF39XZ"
};

// Initialize Firebase
// Note: This assumes the global 'firebase' object is available from the CDN script in index.html
firebase.initializeApp(firebaseConfig);

// Make services available within this module and export them.
export const db = firebase.firestore();
export const auth = firebase.auth();
export const analytics = firebase.analytics();

console.log('🔥 Firebase services initialized in module.');


// --- State Variables (previously global) ---
// Note: These are still tightly coupled with the UI logic that will be refactored later.
let lastVisible = null;
let isLoading = false;


// --- Core Functions ---

export async function signIn() {
    if (auth && !auth.currentUser) {
        try {
            await auth.signInAnonymously();
            console.log('✅ Anonymous authentication successful');
            return auth.currentUser;
        } catch (error) {
            console.error('❌ Anonymous authentication failed:', error);
            throw error; // Re-throw the error to be handled by the caller
        }
    }
    return auth.currentUser;
}

// The data-handling functions are moved here.
// They still contain DOM manipulation, which is a temporary anti-pattern
// that will be resolved in subsequent refactoring steps.

export async function loadPosts(reset = false, currentCategory, postsContainer, loadMoreBtn, displayPost, emptyCallback, errorCallback) {
    if (isLoading) return;
    isLoading = true;
    console.log('📖 Starting to load posts...');
    const postsPerPage = 6;

    if (reset) {
        // This is DOM manipulation that will be removed later.
        postsContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>正在加载文章...</p></div>';
        lastVisible = null;
    }

    if (!db) {
        console.warn('⚠️ Firestore not initialized');
        isLoading = false;
        return;
    }

    try {
        const postsRef = db.collection('posts');
        let q;

        if (currentCategory === 'all') {
            q = postsRef.orderBy('createdAt', 'desc').limit(postsPerPage);
        } else {
            q = postsRef.where('category', '==', currentCategory).orderBy('createdAt', 'desc').limit(postsPerPage);
        }

        if (lastVisible && !reset) {
            q = q.startAfter(lastVisible);
        }

        const snapshot = await q.get();

        if (reset) {
            postsContainer.innerHTML = '';
        }

        if (snapshot.empty && reset) {
            if(emptyCallback) emptyCallback();
            loadMoreBtn.style.display = 'none';
            return;
        }

        snapshot.forEach((doc) => {
            const post = { id: doc.id, ...doc.data() };
            displayPost(post); // This is a call to a UI function, will be decoupled later.
        });

        if (!snapshot.empty) {
            lastVisible = snapshot.docs[snapshot.docs.length - 1];
        }

        loadMoreBtn.style.display = snapshot.size < postsPerPage ? 'none' : 'block';

    } catch (error) {
        console.error('❌ Failed to load posts:', error);
        if (errorCallback) errorCallback(error);
    } finally {
        isLoading = false;
    }
}


export async function handleContactForm(e) {
    e.preventDefault();
    const contactForm = e.target;
    const submitBtn = contactForm.querySelector('.form-submit');
    const originalText = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="btn-spinner"></div><span class="btn-text">发送中...</span>';

    const formData = new FormData(contactForm);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message'),
        createdAt: new Date()
    };

    try {
        if (!db) throw new Error('数据库未初始化');
        await db.collection('messages').add(data);
        alert('✅ 消息发送成功！感谢您的留言。');
        contactForm.reset();
    } catch (error) {
        console.error('❌ 发送消息失败:', error);
        alert(`❌ 发送失败: ${error.message}`);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

export async function handlePostSubmit(e, currentEditingPostId) {
    e.preventDefault();
    const postForm = e.target;
    const submitBtn = postForm.querySelector('#submit-btn');

    if (!db) {
        alert('❌ 数据库未初始化');
        return null;
    }

    const formData = new FormData(postForm);
    const title = formData.get('title')?.trim();
    if (!title) {
        alert('❌ 请填写标题');
        return null;
    }

    const postData = {
        title: title,
        excerpt: formData.get('excerpt')?.trim(),
        content: formData.get('content')?.trim(),
        category: formData.get('category'),
        tags: (formData.get('tags')?.trim() || '').split(',').map(tag => tag.trim()).filter(Boolean),
        readTime: parseInt(formData.get('readTime')) || 5,
        author: '博主',
        updatedAt: firebase.firestore.Timestamp.now()
    };

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';

        if (currentEditingPostId) {
            await db.collection('posts').doc(currentEditingPostId).update(postData);
            alert('✅ 文章更新成功！');
        } else {
            postData.createdAt = firebase.firestore.Timestamp.now();
            await db.collection('posts').add(postData);
            alert('✅ 文章发布成功！');
        }
        return true; // Indicate success
    } catch (error) {
        console.error('❌ 文章操作失败:', error);
        alert(`❌ 操作失败: ${error.message}`);
        return false; // Indicate failure
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = currentEditingPostId ? '更新文章' : '发布文章';
    }
}

export async function fetchPostForEdit(postId) {
    if (!db) {
        alert('❌ 数据库未初始化');
        return null;
    }
    try {
        const doc = await db.collection('posts').doc(postId).get();
        if (doc.exists) {
            return { id: doc.id, ...doc.data() };
        } else {
            alert('❌ 文章不存在或已被删除');
            return null;
        }
    } catch (error) {
        console.error('❌ 获取文章失败:', error);
        alert(`❌ 获取文章失败: ${error.message}`);
        return null;
    }
}


export async function deletePostFromDb(postId) {
    if (!db || !postId) {
        alert('❌ 删除失败：数据库未初始化或文章ID无效');
        return false;
    }
    try {
        await db.collection('posts').doc(postId).delete();
        alert('✅ 文章删除成功！');
        return true;
    } catch (error) {
        console.error('❌ 删除文章失败:', error);
        alert(`❌ 删除失败: ${error.message}`);
        return false;
    }
}
