import { backend } from 'declarations/backend';

let quill;
let commentQuills = new Map();

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
  postsSection.innerHTML = ''; // Clear existing content
  
  for (let index = 0; index < posts.length; index++) {
    const post = posts[index];
    const articleElement = document.createElement('article');
    articleElement.setAttribute('data-post-index', index);
    
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
    
    postsSection.appendChild(articleElement);
  }

  // Wait for the DOM to update
  await new Promise(resolve => setTimeout(resolve, 0));

  // Initialize Quill editors
  for (let index = 0; index < posts.length; index++) {
    initializeQuill(index);
  }

  // Add event listeners for comment forms
  document.querySelectorAll('.comment-form').forEach(form => {
    form.removeEventListener('submit', handleCommentSubmit);
    form.addEventListener('submit', handleCommentSubmit);
  });
}

function initializeQuill(index) {
  const editorElement = document.querySelector(`#comment-editor-${index}`);
  if (editorElement) {
    if (commentQuills.has(index)) {
      commentQuills.get(index).destroy();
    }
    const quillInstance = new Quill(editorElement, {
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
    commentQuills.set(index, quillInstance);
    console.log(`Quill initialized for index ${index}:`, quillInstance);
  } else {
    console.error(`Editor element not found for index ${index}`);
  }
}

async function handleCommentSubmit(e) {
  e.preventDefault();
  const postIndex = parseInt(e.target.querySelector('button').dataset.postIndex, 10);
  const author = e.target.querySelector('input').value;
  
  try {
    const quillInstance = commentQuills.get(postIndex);
    console.log(`Quill instance for index ${postIndex}:`, quillInstance);
    
    if (quillInstance && quillInstance.root) {
      const content = quillInstance.root.innerHTML;
      const submitButton = e.target.querySelector('button');
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting...';
      
      await backend.addComment(postIndex, author, content);
      await debouncedDisplayPosts();
    } else {
      console.error('Quill instance or root not found for index:', postIndex);
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
