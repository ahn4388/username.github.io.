// common.js

export function getTopicsFromLocalStorage() {
    return JSON.parse(localStorage.getItem('topics')) || [];
}

export function saveTopicsToLocalStorage(topics) {
    localStorage.setItem('topics', JSON.stringify(topics));
}

export function createTopic(title, hashtags) {
    return {
        title,
        hashtags,
        id: Date.now(),
        comments: [],
        upvotes: 0
    };
}

export function deleteTopicById(topics, topicId) {
    return topics.filter(topic => topic.id !== topicId);
}

export function findTopicById(topics, topicId) {
    return topics.find(topic => topic.id == topicId);
}
