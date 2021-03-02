import * as yup from 'yup';
import { setLocale } from 'yup';
import axios from 'axios';
import _ from 'lodash';

import initView from './view.js';

const UPDATE_INTERVAL = 5000;

const prepareUrl = (url) => `https://hexlet-allorigins.herokuapp.com/raw?url=${encodeURIComponent(url)}`;

const getFeed = (url) => {
  const preparedUrl = prepareUrl(url);
  const data = axios.get(preparedUrl)
    .then((res) => res.data);
  return data;
};

const parseRSS = (string) => {
  const domparser = new DOMParser();
  const data = domparser.parseFromString(string, 'application/xml');
  const title = data.querySelector('title').textContent;
  const description = data.querySelector('description').textContent;

  const items = data.querySelectorAll('item');
  const posts = Array.from(items).map((item) => {
    const postTitle = item.querySelector('title').textContent;
    const postDescription = item.querySelector('description').textContent;
    const postUrl = item.querySelector('link').textContent;

    return { title: postTitle, description: postDescription, url: postUrl };
  });

  return { title, description, posts };
};

const validate = (url, feeds) => {
  setLocale({
    string: {
      default: 'messages.errors.invalidUrl',
      url: 'messages.errors.invalidUrl',
    },
  });

  const schema = yup
    .string()
    .trim()
    .url()
    .notOneOf(feeds, 'messages.errors.alreadyExist')
    .required();

  try {
    schema.validateSync(url);
    return null;
  } catch (err) {
    return err.message;
  }
};

const handleFeed = (url, feed, state) => {
  const { title, description } = feed;
  const feedId = _.uniqueId();

  state.feeds.push({
    id: feedId,
    title,
    description,
    url,
  });

  return feedId;
};

const handlePosts = (feedId, feed, state) => {
  const { posts } = feed;

  const linkedPosts = posts.map((post) => {
    const newPost = { ...post, feedId };
    return newPost;
  });

  const postsDiff = _.differenceBy(linkedPosts, state.posts, 'url');
  state.posts.unshift(...postsDiff);
};

const updatePosts = (state) => {
  state.feeds.forEach((feed) => {
    const { id, url } = feed;

    getFeed(url)
      .then((data) => parseRSS(data))
      .then((rss) => handlePosts(id, rss, state));
  });

  setInterval(updatePosts, UPDATE_INTERVAL, state);
};

export default () => {
  const state = {
    form: {
      status: 'filling',
      message: '',
    },
    feeds: [],
    posts: [],
    language: 'ru',
    updateTimerId: null,
  };

  const elements = {
    input: document.querySelector('[name="url"]'),
    button: document.querySelector('[type="submit"'),
    feedsBlock: document.querySelector('.feeds'),
    postsBlock: document.querySelector('.posts'),
    feedback: document.querySelector('.feedback'),
  };

  const watched = initView(state, elements);

  const form = document.querySelector('#rss-form');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');

    watched.form.status = 'proccessing';

    const feedList = state.feeds.map((feed) => feed.url);

    const error = validate(url, feedList);
    if (error) {
      watched.form.message = error;
      watched.form.status = 'failed';
      return;
    }

    getFeed(url)
      .then((data) => parseRSS(data))
      .then((feed) => {
        const feedId = handleFeed(url, feed, watched);
        handlePosts(feedId, feed, watched);
      })
      .then(() => {
        watched.form.message = 'messages.success.loaded';
        watched.form.status = 'success';
      })
      .then(() => {
        if (!state.updateTimerId) {
          state.updateTimerId = setTimeout(updatePosts, UPDATE_INTERVAL, watched);
        }
      })
      .catch(() => {
        watched.form.message = 'messages.errors.wrongResource';
        watched.form.status = 'failed';
      });
  });
};
