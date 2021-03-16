import 'bootstrap';
import * as yup from 'yup';
import { setLocale } from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import _ from 'lodash';

import resources from './locales';
import initView from './view.js';
import parseRSS from './parser.js';

const UPDATE_INTERVAL = 20000;

const prepareUrl = (url) => {
  const preparedUrl = new URL('/get', 'https://hexlet-allorigins.herokuapp.com/');
  const params = new URLSearchParams({
    disableCache: true,
    url,
  });

  preparedUrl.search = params;

  return preparedUrl.href;
};

const getFeed = (url) => {
  const preparedUrl = prepareUrl(url);
  const data = axios.get(preparedUrl)
    .then((res) => res.data.contents);
  return data;
};

const validate = (url, feeds) => {
  const feedUrls = feeds.map((feed) => feed.url);

  const schema = yup
    .string()
    .trim()
    .url()
    .notOneOf(feedUrls, 'messages.errors.alreadyExist')
    .required();

  try {
    schema.validateSync(url);
    return null;
  } catch (err) {
    return err.message;
  }
};

const handleFeed = (url, rss) => {
  const { title, description, posts } = rss;
  const feedId = _.uniqueId();

  const feed = {
    id: feedId,
    url,
    title,
    description,
  };

  const newPosts = posts.map((post) => {
    const postId = _.uniqueId();
    const newPost = { id: postId, ...post, feedId };
    return newPost;
  });

  return { feed, posts: newPosts };
};

const updatePosts = (state) => {
  const promises = state.feeds.map((feed) => {
    const { id: feedId, url } = feed;

    return getFeed(url)
      .then((data) => parseRSS(data))
      .then(({ posts }) => {
        const postsDiff = _.differenceBy(posts, state.posts, 'url');

        const newPosts = postsDiff.map((post) => {
          const postId = _.uniqueId();
          const newPost = { id: postId, ...post, feedId };
          return newPost;
        });

        state.posts.unshift(...newPosts);
      });
  });

  Promise.all(promises)
    .then(() => setTimeout(updatePosts, UPDATE_INTERVAL, state));
};

export default () => {
  const i18nextInstance = i18next.createInstance();

  const state = {
    form: {
      status: 'filling',
      message: '',
    },
    loadingProcess: {
      status: 'idle',
      message: '',
    },
    feeds: [],
    posts: [],
    ui: {
      watchedPosts: new Set(),
      modal: {
        postId: null,
      },
    },
  };

  const elements = {
    form: document.querySelector('#rss-form'),
    input: document.querySelector('[name="url"]'),
    button: document.querySelector('[type="submit"'),
    feedsBlock: document.querySelector('.feeds'),
    postsBlock: document.querySelector('.posts'),
    feedback: document.querySelector('.feedback'),
    modalTitle: document.querySelector('.modal-title'),
    modalBody: document.querySelector('.modal-body'),
    modalLink: document.querySelector('.full-article'),
  };

  setLocale({
    string: {
      default: 'messages.errors.invalidUrl',
      url: 'messages.errors.invalidUrl',
    },
  });

  i18nextInstance.init({
    lng: 'ru',
    resources,
  })
    .then(() => {
      const watched = initView(state, elements, i18nextInstance);

      setTimeout(updatePosts, UPDATE_INTERVAL, watched);

      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const url = formData.get('url');

        const error = validate(url, state.feeds);
        if (error) {
          watched.form.message = error;
          watched.form.status = 'invalid';
          return;
        }

        watched.form.message = '';
        watched.form.status = 'filling';

        watched.loadingProcess.status = 'loading';
        getFeed(url)
          .then((data) => {
            const rss = parseRSS(data);
            const { feed, posts } = handleFeed(url, rss);
            watched.feeds.unshift(feed);
            watched.posts.unshift(...posts);
            watched.loadingProcess.message = 'messages.success.loaded';
            watched.loadingProcess.status = 'idle';
          })
          .catch((err) => {
            if (err.request) {
              watched.loadingProcess.message = 'messages.errors.network';
            } else {
              watched.loadingProcess.message = 'messages.errors.wrongResource';
            }

            watched.loadingProcess.status = 'failed';
          });
      });

      elements.postsBlock.addEventListener('click', (e) => {
        e.stopPropagation();
        const postId = e.target.dataset.id;

        if (!postId) {
          return;
        }

        watched.ui.watchedPosts.add(postId);
        watched.ui.modal.postId = postId;
      });
    });
};
