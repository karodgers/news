const apiBase = 'https://hacker-news.firebaseio.com/v0';
let currentIndex = 0;
const postsPerPage = 10;

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Fetches and displays posts in batches.
async function fetchPosts() {
    const response = await fetch(`${apiBase}/topstories.json`);
    const storyIds = await response.json();
    
    for (let i = currentIndex; i < currentIndex + postsPerPage; i++) {
        if (i >= storyIds.length) break;
        const postId = storyIds[i];
        const postData = await fetchItem(postId);
        displayPost(postData);
    }
    
    currentIndex += postsPerPage;
}

// Fetches individual items (posts or comments).
async function fetchItem(id) {
    const response = await fetch(`${apiBase}/item/${id}.json`);
    return await response.json();
}

// Renders a post to the UI.
function displayPost(post) {
    const postElement = document.createElement('div');
    postElement.className = 'post';
    const postLink = post.url || '#';
    postElement.innerHTML = 
        `<a href="${postLink}" target="_blank">
            <h3>${post.title}</h3>
        </a>
        <p class="post-info">By: ${post.by} | Score: ${post.score}</p>
        ${post.url ? `<a href="${post.url}" target="_blank">Read more</a>` : ''}
        <button onclick="loadComments(${post.id})">Load Comments</button>
        <div id="comments-${post.id}"></div>`;
    
    document.getElementById('posts').appendChild(postElement);
}


// Loads and displays comments for a post.
async function loadComments(postId) {
    const post = await fetchItem(postId);
    const commentsContainer = document.getElementById(`comments-${postId}`);
    commentsContainer.innerHTML = '';

    if (post.kids) {
        for (const commentId of post.kids) {
            const comment = await fetchItem(commentId);
            displayComment(comment, commentsContainer);
        }
    }
}

//  Renders a comment to the UI.
function displayComment(comment, container) {
    if (comment.deleted || comment.dead) return;

    const commentElement = document.createElement('div');
    commentElement.className = 'comment';
    commentElement.innerHTML = `
        <p>${comment.text}</p>
        <p class="post-info">By: ${comment.by}</p>
    `;
    container.appendChild(commentElement);
}

// Checks for live updates every 5 seconds.
function checkLiveUpdates() {
    fetch(`${apiBase}/updates.json`)
        .then(response => response.json())
        .then(data => {
            const liveUpdateContent = document.getElementById('liveUpdateContent');
            liveUpdateContent.innerHTML = `
                <p>Items updated: ${data.items.length}</p>
                <p>Profiles updated: ${data.profiles.length}</p>
            `;
        });
}

// Initial load
fetchPosts();

// Load more posts
document.getElementById('loadMore').addEventListener('click', fetchPosts);

// Check for live updates every 5 seconds
setInterval(checkLiveUpdates, 5000);

// Throttled fetch posts function
const throttledFetchPosts = throttle(fetchPosts, 1000);

// Use throttled function for scroll events
window.addEventListener('scroll', () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
        throttledFetchPosts();
    }
});