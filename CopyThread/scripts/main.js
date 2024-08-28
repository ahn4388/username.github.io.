// main.js

import { getTopicsFromLocalStorage, saveTopicsToLocalStorage, createTopic, deleteTopicById } from './common.js';

document.addEventListener('DOMContentLoaded', function() {
    const topics = getTopicsFromLocalStorage();
    const topicList = document.getElementById('topicList');
    const mzTopicList = document.getElementById('mzTopicList');
    const createTopicForm = document.getElementById('createTopicForm');

    displayTopics(topics);
    displayMzTopics(topics);

    createTopicForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const title = document.getElementById('topicTitle').value;
        const hashtags = document.getElementById('topicHashtags').value.split(',').map(tag => tag.trim());

        const newTopic = createTopic(title, hashtags);
        topics.push(newTopic);
        saveTopicsToLocalStorage(topics);

        displayTopics(topics);
        displayMzTopics(topics);

        createTopicForm.reset();
    });

    function displayTopics(topics) {
        topicList.innerHTML = '';
        topics.forEach(topic => {
            const topicDiv = document.createElement('div');
            topicDiv.classList.add('topic-item');

            const title = document.createElement('h3');
            title.textContent = topic.title;

            const hashtags = document.createElement('p');
            hashtags.textContent = `#${topic.hashtags.join(' #')}`;

            const commentCount = document.createElement('p');
            commentCount.textContent = `댓글 수: ${topic.comments.length}`;
            commentCount.classList.add('comment-count');

            const deleteButton = document.createElement('button');
            deleteButton.textContent = '삭제';
            deleteButton.classList.add('delete-button');
            deleteButton.addEventListener('click', function(event) {
                event.stopPropagation();
                if (confirm(`"${topic.title}" 주제를 삭제하시겠습니까?`)) {
                    const updatedTopics = deleteTopicById(topics, topic.id);
                    saveTopicsToLocalStorage(updatedTopics);
                    displayTopics(updatedTopics);
                    displayMzTopics(updatedTopics);
                }
            });

            topicDiv.appendChild(title);
            topicDiv.appendChild(hashtags);
            topicDiv.appendChild(commentCount);
            topicDiv.appendChild(deleteButton);

            topicDiv.addEventListener('click', function() {
                window.location.href = `topic.html?id=${topic.id}`;
            });

            topicList.appendChild(topicDiv);
        });
    }

    function displayMzTopics(topics) {
        mzTopicList.innerHTML = '';

        const sortedTopics = topics.slice().sort((a, b) => {
            const scoreA = (a.comments || []).reduce((acc, comment) => acc + (comment.upvotes || 0), 0) + (a.comments ? a.comments.length : 0);
            const scoreB = (b.comments || []).reduce((acc, comment) => acc + (comment.upvotes || 0), 0) + (b.comments ? b.comments.length : 0);
            return scoreB - scoreA;
        });

        sortedTopics.slice(0, 5).forEach(topic => {
            const topicDiv = document.createElement('div');
            topicDiv.classList.add('topic-item');

            const title = document.createElement('h3');
            title.textContent = topic.title;

            const hashtags = document.createElement('p');
            hashtags.textContent = `#${topic.hashtags.join(' #')}`;

            const commentCount = document.createElement('p');
            commentCount.textContent = `댓글 수: ${topic.comments.length}`;
            commentCount.classList.add('comment-count');

            topicDiv.appendChild(title);
            topicDiv.appendChild(hashtags);
            topicDiv.appendChild(commentCount);

            topicDiv.addEventListener('click', function() {
                window.location.href = `topic.html?id=${topic.id}`;
            });

            mzTopicList.appendChild(topicDiv);
        });
    }
});
