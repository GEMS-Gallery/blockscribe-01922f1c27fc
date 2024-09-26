import { backend } from 'declarations/backend';

let quill;
let commentQuills = {};
let quillInitPromises = {};

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
    await displayPosts();
  });

  await backend.init();
  await displayPosts();
});

async function displayPosts() {
  const posts = await backend.getPosts();
  const postsSection = document.getElementById('posts');
  postsSection.innerHTML = '';

  posts.forEach((post, index) => {
    const article = document.createElement('article');
    article.innerHTML = `
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
        <button type="submit" data-post-index="${index}" disabled>Add Comment</button>
      </form>
    `;
    postsSection.appendChild(article);

    // Initialize Quill editor for this comment
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
      // Enable the submit button once Quill is initialized
      const submitButton = article.querySelector('button[type="submit"]');
      submitButton.disabled = false;
      resolve();
    });
  });

  // Add event listeners for comment forms
  document.querySelectorAll('.comment-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
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
          await displayPosts();
        } else {
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
    });
  });
}
