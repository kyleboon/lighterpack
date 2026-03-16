import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Errors from '../../../client/components/errors.vue';

describe('Errors component', () => {
    it('renders nothing when errors is null', () => {
        const wrapper = mount(Errors, { props: { errors: null } });
        expect(wrapper.find('ul').exists()).toBe(false);
    });

    it('renders a string error', () => {
        const wrapper = mount(Errors, { props: { errors: 'Something went wrong' } });
        expect(wrapper.find('li').text()).toBe('Something went wrong');
    });

    it('renders an object with message property', () => {
        const wrapper = mount(Errors, { props: { errors: { message: 'Bad request' } } });
        expect(wrapper.find('li').text()).toBe('Bad request');
    });

    it('renders an array of error objects', () => {
        const wrapper = mount(Errors, {
            props: { errors: [{ message: 'Error one' }, { message: 'Error two' }] },
        });
        const items = wrapper.findAll('li');
        expect(items).toHaveLength(2);
        expect(items[0].text()).toBe('Error one');
        expect(items[1].text()).toBe('Error two');
    });

    it('renders an array of error strings', () => {
        const wrapper = mount(Errors, { props: { errors: ['First', 'Second'] } });
        const items = wrapper.findAll('li');
        expect(items).toHaveLength(2);
        expect(items[0].text()).toBe('First');
    });

    it('renders unknown error fallback for unrecognized input', () => {
        const wrapper = mount(Errors, { props: { errors: [{}] } });
        expect(wrapper.find('li').text()).toBe('An unknown error occurred.');
    });

    it('unwraps nested errors array', () => {
        const wrapper = mount(Errors, {
            props: { errors: { errors: [{ message: 'Nested error' }] } },
        });
        expect(wrapper.find('li').text()).toBe('Nested error');
    });
});
