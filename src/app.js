import * as yup from 'yup';
import axios from 'axios';
import _ from 'lodash';

import View from './View.js';

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

export default () => {
  const state = {
    form: {
      validationState: '',
      status: '',
    },
    feeds: [],
    posts: [],
  };

  const view = new View(state);
  view.init();

  const form = document.querySelector('#rss-form');
  const schema = yup.string().url();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url').trim();
    schema
      .isValid(url)
      .then((isValid) => {
        if (!isValid) {
          view.watchedFormState.validationState = 'invalid';
          view.watchedFormState.status = 'Ссылка должна быть валидным URL';
          throw new Error('Ссылка должна быть валидным URL');
        }

        if (isValid) {
          const isExist = state.feeds.some((feed) => feed.url === url);

          if (isExist) {
            view.watchedFormState.validationState = 'invalid';
            view.watchedFormState.status = 'RSS уже существует';
            throw new Error('RSS уже существует');
          }
        }
      })
      .then(() => getFeed(url))
      .then((data) => parseRSS(data))
      .then(({ title, description, posts }) => {
        const feedId = _.uniqueId();
        view.watchedFeedsState.push({
          id: feedId,
          title,
          description,
          url,
        });

        const linkedPosts = posts.map((post) => {
          const newPost = { ...post, feedId };
          return newPost;
        });
        view.watchedPostsState.push(...linkedPosts);

        view.watchedFormState.validationState = 'valid';
        view.watchedFormState.status = 'RSS успешно загружен';
      })
      .catch((err) => console.log(err));
  });
};
