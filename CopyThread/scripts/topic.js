import { getTopicsFromLocalStorage, saveTopicsToLocalStorage, findTopicById } from './common.js';

document.addEventListener('DOMContentLoaded', function () {
    const params = new URLSearchParams(window.location.search);
    const topicId = params.get('id');

    let topics = getTopicsFromLocalStorage();
    const topic = findTopicById(topics, topicId);

    const commentsDiv = document.getElementById('comments');
    const commentsContainer = document.getElementById('commentsContainer');
    const scrollToTopButton = document.getElementById('scrollToTopButton');
    const scrollToBottomButton = document.getElementById('scrollToBottomButton');
    let mentionedComment; // 팝업에서 사용할 댓글 변수

    if (!topic) {
        alert('존재하지 않는 주제입니다.');
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('topicTitle').textContent = `${topic.title} - ${topic.hashtags.join(', ')}`;

    function assignCommentNumbers(comments) {
        comments.forEach((comment, index) => {
            if (!comment.number) {
                comment.number = index + 1;
            }
        });
    }

    assignCommentNumbers(topic.comments);
    saveTopicsToLocalStorage(topics);

    // 언급된 번호 파싱 및 링크 생성 함수
    function parseMentions(content) {
        return content.replace(/#(\d+)/g, function (match, p1) {
            return `<a href="#" class="mention-link" data-number="${p1}">${match}</a>`;
        });
    }

    // 댓글을 표시하는 함수
    function displayComments(comments) {
        commentsDiv.innerHTML = '';
        comments.forEach((comment) => {
            const commentDiv = document.createElement('div');
            commentDiv.classList.add('comment');

            const commentNumber = document.createElement('div');
            commentNumber.classList.add('comment-number');
            commentNumber.textContent = `#${comment.number}`;
            commentDiv.appendChild(commentNumber);

            const userInfo = document.createElement('div');
            userInfo.classList.add('user-info');
            userInfo.textContent = comment.username;

            const content = document.createElement('div');
            content.classList.add('comment-content');
            content.innerHTML = parseMentions(comment.content); // 언급된 번호를 파싱하여 링크로 변환

            if (comment.fileUrls && comment.fileUrls.length > 0) {
                const fileContainer = document.createElement('div');
                fileContainer.classList.add('file-preview-container');

                comment.fileUrls.forEach(fileUrl => {
                    const fileElement = document.createElement(fileUrl.endsWith('.mp4') ? 'video' : 'img');
                    fileElement.src = fileUrl;
                    fileElement.classList.add('file-preview');
                    if (fileElement.tagName === 'VIDEO') fileElement.controls = true;

                    fileElement.addEventListener('click', () => {
                        const fullscreenImageContainer = document.getElementById('fullscreenImageContainer');
                        const fullscreenImage = document.getElementById('fullscreenImage');
                        fullscreenImage.src = fileUrl;
                        fullscreenImageContainer.style.display = 'flex';
                    });

                    fileContainer.appendChild(fileElement);
                });

                content.appendChild(fileContainer);
            }

            const actions = document.createElement('div');
            actions.classList.add('actions');

            const upvoteButton = document.createElement('button');
            upvoteButton.textContent = `추천 (${comment.upvotes})`;
            upvoteButton.addEventListener('click', () => {
                comment.upvotes++;
                saveTopicsToLocalStorage(topics);
                upvoteButton.textContent = `추천 (${comment.upvotes})`;

                upvoteButton.classList.add('flash-green');
                setTimeout(() => {
                    upvoteButton.classList.remove('flash-green');
                }, 500);
            });

            const downvoteButton = document.createElement('button');
            downvoteButton.textContent = `비추천 (${comment.downvotes})`;
            downvoteButton.addEventListener('click', () => {
                comment.downvotes++;
                saveTopicsToLocalStorage(topics);
                downvoteButton.textContent = `비추천 (${comment.downvotes})`;

                downvoteButton.classList.add('flash-red');
                setTimeout(() => {
                    downvoteButton.classList.remove('flash-red');
                }, 500);
            });

            actions.appendChild(upvoteButton);
            actions.appendChild(downvoteButton);

            commentDiv.appendChild(userInfo);
            commentDiv.appendChild(content);
            commentDiv.appendChild(actions);

            commentsDiv.appendChild(commentDiv);
        });
    }

    displayComments(topic.comments);

    // 언급된 번호 클릭 이벤트 처리
    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('mention-link')) {
            event.preventDefault();
            const mentionNumber = event.target.getAttribute('data-number');
            mentionedComment = topic.comments.find(c => c.number == mentionNumber);
            if (mentionedComment) {
                const overlay = document.getElementById('mentionOverlay');
                const mentionContent = document.getElementById('mentionContent');

                mentionContent.innerHTML = `
                    <strong>#${mentionedComment.number} ${mentionedComment.username}</strong>: ${mentionedComment.content}
                    <button id="scrollToCommentButton">댓글로 이동</button>
                `;

                if (mentionedComment.fileUrls && mentionedComment.fileUrls.length > 0) {
                    const imgContainer = document.createElement('div');
                    imgContainer.style.marginTop = "10px";

                    mentionedComment.fileUrls.forEach(fileUrl => {
                        const imgElement = document.createElement('img');
                        imgElement.src = fileUrl;
                        imgElement.classList.add('mention-img-preview');
                        imgContainer.appendChild(imgElement);
                    });
                    mentionContent.appendChild(imgContainer);
                }

                overlay.style.display = 'block';
            }
        }
    });

    // 팝업 외부 클릭 시 팝업 닫기
    document.getElementById('mentionOverlay').addEventListener('click', function(event) {
        if (event.target === this) {
            this.style.display = 'none';
        }
    });

    // 스크롤 버튼 클릭 이벤트 처리
    document.addEventListener('click', function (event) {
        if (event.target.id === 'scrollToCommentButton') {
            const overlay = document.getElementById('mentionOverlay');
            overlay.style.display = 'none'; // 팝업 닫기

            if (mentionedComment) {
                const commentElement = Array.from(document.querySelectorAll('.comment-number')).find(el => el.textContent === `#${mentionedComment.number}`).parentNode;
                const containerHeight = commentsContainer.clientHeight;
                const commentOffset = commentElement.offsetTop - commentsContainer.offsetTop;
                const scrollTo = commentOffset - (containerHeight / 2 - commentElement.clientHeight / 2);

                commentsContainer.scrollTo({
                    top: scrollTo,
                    behavior: 'smooth'
                });

                commentElement.classList.add('highlighted');
                setTimeout(() => {
                    commentElement.classList.remove('highlighted');
                }, 2000);
            }
        }
    });

    // 스크롤 버튼 표시/숨김 함수
    function toggleScrollButtons() {
        const isAtBottom = commentsContainer.scrollHeight - commentsContainer.scrollTop === commentsContainer.clientHeight;
        const isAtTop = commentsContainer.scrollTop === 0;

        scrollToBottomButton.classList.toggle('visible', !isAtBottom);
        scrollToTopButton.classList.toggle('visible', !isAtTop);
    }

    toggleScrollButtons();

    commentsContainer.addEventListener('scroll', toggleScrollButtons);

    scrollToTopButton.addEventListener('click', () => {
        commentsContainer.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    scrollToBottomButton.addEventListener('click', () => {
        commentsContainer.scrollTo({
            top: commentsContainer.scrollHeight,
            behavior: 'smooth'
        });
    });

    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');
    const searchType = document.getElementById('searchType');

    searchButton.addEventListener('click', function () {
        if (searchButton.textContent === "취소") {
            displayComments(topic.comments);
            searchButton.textContent = "검색";
            searchInput.value = '';
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        const searchTerm = searchInput.value.trim().toLowerCase();
        if (!searchTerm) return;

        let filteredComments = [];

        if (searchType.value === 'content' || searchType.value === 'username') {
            filteredComments = topic.comments.filter(comment =>
                comment.content.toLowerCase().includes(searchTerm) ||
                comment.username.toLowerCase().includes(searchTerm)
            );
        } else if (searchType.value === 'number') {
            const ranges = searchTerm.split(',').map(range => range.trim());
            ranges.forEach(range => {
                if (range.includes(' ')) {
                    const [start, end] = range.split(' ').map(Number);
                    filteredComments.push(...topic.comments.filter(comment => comment.number >= start && comment.number <= end));
                } else {
                    const number = Number(range);
                    filteredComments.push(...topic.comments.filter(comment => comment.number === number));
                }
            });
        }

        if (filteredComments.length > 0) {
            displayComments(filteredComments);
            searchButton.textContent = "취소";
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            alert("검색 결과가 없습니다.");
        }
    });

    document.getElementById('fileInput').addEventListener('change', function () {
        const filePreviewContainer = document.getElementById('filePreview');
        filePreviewContainer.innerHTML = '';

        const files = Array.from(this.files);
        files.forEach(file => {
            const fileUrl = URL.createObjectURL(file);
            const fileElement = document.createElement(file.type.startsWith('image/') ? 'img' : 'video');

            fileElement.src = fileUrl;
            fileElement.classList.add('file-preview');
            if (fileElement.tagName === 'VIDEO') fileElement.controls = true;

            fileElement.addEventListener('click', () => {
                const fullscreenImageContainer = document.getElementById('fullscreenImageContainer');
                const fullscreenImage = document.getElementById('fullscreenImage');
                fullscreenImage.src = fileUrl;
                fullscreenImageContainer.style.display = 'flex';
            });

            filePreviewContainer.appendChild(fileElement);
        });
    });

    const commentForm = document.getElementById('commentForm');
    const submitButton = commentForm.querySelector('button[type="submit"]');
    const commentInput = document.getElementById('commentInput');

    commentInput.addEventListener('input', function () {
        if (commentInput.value.trim().length > 0) {
            submitButton.classList.remove('inactive');
            submitButton.classList.add('active');
            submitButton.disabled = false;
        } else {
            submitButton.classList.remove('active');
            submitButton.classList.add('inactive');
            submitButton.disabled = true;
        }
    });

    commentForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const content = commentInput.value.trim();
        let username = document.getElementById('username').value.trim() || 'ㅁㄴㅇㄹ';
        const password = document.getElementById('password').value.trim();

        const fileInput = document.getElementById('fileInput');
        const files = Array.from(fileInput.files);
        const fileUrls = files.map(file => URL.createObjectURL(file));

        const newComment = {
            username,
            content,
            password,
            fileUrls,
            upvotes: 0,
            downvotes: 0,
            number: topic.comments.length + 1
        };
        topic.comments.push(newComment);
        saveTopicsToLocalStorage(topics);

        if (topic.comments.length === 1) {
            commentsDiv.innerHTML = '';
            commentsDiv.classList.remove('empty');
        }

        const commentDiv = document.createElement('div');
        commentDiv.classList.add('comment', 'new-comment');
        commentDiv.style.opacity = 0;
        commentDiv.style.transform = 'translateX(-100%)';

        const commentNumber = document.createElement('div');
        commentNumber.classList.add('comment-number');
        commentNumber.textContent = `#${newComment.number}`;
        commentDiv.appendChild(commentNumber);

        const userInfo = document.createElement('div');
        userInfo.classList.add('user-info');
        userInfo.textContent = newComment.username;
        commentDiv.appendChild(userInfo);

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('comment-content');
        contentDiv.innerHTML = parseMentions(newComment.content);
        commentDiv.appendChild(contentDiv);

        if (newComment.fileUrls && newComment.fileUrls.length > 0) {
            const fileContainer = document.createElement('div');
            fileContainer.classList.add('file-preview-container');

            newComment.fileUrls.forEach(fileUrl => {
                const fileElement = document.createElement(fileUrl.endsWith('.mp4') ? 'video' : 'img');
                fileElement.src = fileUrl;
                fileElement.classList.add('file-preview');
                if (fileElement.tagName === 'VIDEO') fileElement.controls = true;

                fileElement.addEventListener('click', () => {
                    const fullscreenImageContainer = document.getElementById('fullscreenImageContainer');
                    const fullscreenImage = document.getElementById('fullscreenImage');
                    fullscreenImage.src = fileUrl;
                    fullscreenImageContainer.style.display = 'flex';
                });

                fileContainer.appendChild(fileElement);
            });

            contentDiv.appendChild(fileContainer);
        }

        const actions = document.createElement('div');
        actions.classList.add('actions');

        const upvoteButton = document.createElement('button');
        upvoteButton.textContent = `추천 (${newComment.upvotes})`;
        upvoteButton.addEventListener('click', () => {
            newComment.upvotes++;
            saveTopicsToLocalStorage(topics);
            upvoteButton.textContent = `추천 (${newComment.upvotes})`;

            upvoteButton.classList.add('flash-green');
            setTimeout(() => {
                upvoteButton.classList.remove('flash-green');
            }, 500);
        });

        const downvoteButton = document.createElement('button');
        downvoteButton.textContent = `비추천 (${newComment.downvotes})`;
        downvoteButton.addEventListener('click', () => {
            newComment.downvotes++;
            saveTopicsToLocalStorage(topics);
            downvoteButton.textContent = `비추천 (${newComment.downvotes})`;

            downvoteButton.classList.add('flash-red');
            setTimeout(() => {
                downvoteButton.classList.remove('flash-red');
            }, 500);
        });

        actions.appendChild(upvoteButton);
        actions.appendChild(downvoteButton);

        commentDiv.appendChild(actions);

        commentsDiv.appendChild(commentDiv);

        // 새 댓글 애니메이션 효과
        requestAnimationFrame(() => {
            commentDiv.style.opacity = 1;
            commentDiv.style.transform = 'translateX(0)';
        });

        // 폼 초기화
        commentInput.value = '';
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        fileInput.value = '';
        filePreviewContainer.innerHTML = '';

        submitButton.classList.remove('active');
        submitButton.classList.add('inactive');
        submitButton.disabled = true;
    });
});
