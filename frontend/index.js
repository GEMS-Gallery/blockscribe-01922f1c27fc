import { backend } from 'declarations/backend';

let quill;
let commentQuills = {};
let quillInitPromises = {};

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

document.addEventListener('DOMContentLoaded', async () => {
  quill = new Quill('#editor', {
    theme: 'snow'
  });

  const newPostBtn = document.getElementById('newPostBtn');
  const newPostForm = document.getElementById('newPostForm');
  const postForm = document.getElementById('postForm');
  const postsSection = document.getElementById('posts');

  newPostBtn.addEventListener('click', () => {
    newPostForm.style.display = 'block';
  });

  postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;
    const body = quill.root.innerHTML;

    await backend.addPost(title, body, author);
    newPostForm.style.display = 'none';
    postForm.reset();
    quill.setContents([]);
    await debouncedDisplayPosts();
  });

  await backend.init();
  await debouncedDisplayPosts();
});

const debouncedDisplayPosts = debounce(displayPosts, 300);

async function displayPosts() {
  const posts = await backend.getPosts();
  const postsSection = document.getElementById('posts');
  
  posts.forEach((post, index) => {
    let articleElement = postsSection.querySelector(`article[data-post-index="${index}"]`);
    if (!articleElement) {
      articleElement = document.createElement('article');
      articleElement.setAttribute('data-post-index', index);
      postsSection.appendChild(articleElement);
    }

    articleElement.innerHTML = `
      <h2>${post.title}</h2>
      <p class="author">By ${post.author}</p>
      <div class="content">${post.body}</div>
      <p class="timestamp">${new Date(Number(post.timestamp) / 1000000).toLocaleString()}</p>
      <div class="comments">
        <h3>Comments</h3>
        ${post.comments.map(comment => `
          <div class="comment">
            <p><strong>${comment.author}</strong>:</p>
            <div>${comment.content}</div>
            <p class="timestamp">${new Date(Number(comment.timestamp) / 1000000).toLocaleString()}</p>
          </div>
        `).join('')}
      </div>
      <form class="comment-form">
        <input type="text" placeholder="Your name" required>
        <div class="comment-editor" id="comment-editor-${index}"></div>
        <button type="submit" data-post-index="${index}">Add Comment</button>
      </form>
    `;

    initializeOrUpdateQuill(index);
  });

  // Remove any articles that are no longer needed
  Array.from(postsSection.children).forEach(child => {
    const index = child.getAttribute('data-post-index');
    if (!posts[index]) {
      postsSection.removeChild(child);
      delete commentQuills[index];
      delete quillInitPromises[index];
    }
  });

  // Add event listeners for comment forms
  document.querySelectorAll('.comment-form').forEach(form => {
    form.removeEventListener('submit', handleCommentSubmit);
    form.addEventListener('submit', handleCommentSubmit);
  });
}

function initializeOrUpdateQuill(index) {
  if (!commentQuills[index]) {
    quillInitPromises[index] = new Promise((resolve) => {
      commentQuills[index] = new Quill(`#comment-editor-${index}`, {
        theme: 'snow',
        placeholder: 'Write your comment...',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline'],
            ['link', 'blockquote'],
            [{ list: 'ordered' }, { list: 'bullet' }]
          ]
        }
      });
      resolve();
    });
  } else {
    // If Quill instance already exists, just update its container
    commentQuills[index].container = document.querySelector(`#comment-editor-${index}`);
  }
}

async function handleCommentSubmit(e) {
  e.preventDefault();
  const postIndex = e.target.querySelector('button').dataset.postIndex;
  const author = e.target.querySelector('input').value;
  
  try {
    // Wait for Quill to be initialized
    await quillInitPromises[postIndex];
    const quillInstance = commentQuills[postIndex];
    
    if (quillInstance && quillInstance.root) {
      const content = quillInstance.root.innerHTML;
      const submitButton = e.target.querySelector('button');
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting...';
      
      await backend.addComment(Number(postIndex), author, content);
      await debouncedDisplayPosts();
    } else {
      console.error('Quill instance or root not found:', quillInstance);
      throw new Error('Quill editor not properly initialized');
    }
  } catch (error) {
    console.error('Error adding comment:', error);
    alert('Failed to add comment. Please try again.');
  } finally {
    const submitButton = e.target.querySelector('button');
    submitButton.disabled = false;
    submitButton.textContent = 'Add Comment';
  }
}
