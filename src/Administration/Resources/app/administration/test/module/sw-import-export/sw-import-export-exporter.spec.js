import { createLocalVue, shallowMount } from '@vue/test-utils';
import 'src/module/sw-import-export/component/sw-import-export-exporter';
import 'src/app/component/form/select/entity/sw-entity-single-select';
import 'src/app/component/form/select/base/sw-select-base';
import 'src/app/component/form/field-base/sw-block-field';
import 'src/app/component/form/field-base/sw-base-field';
import 'src/app/component/form/select/base/sw-select-result-list';
import 'src/app/component/form/select/base/sw-select-result';
import 'src/app/component/base/sw-highlight-text';

const repositoryMockFactory = () => {
    return {
        search: (criteria) => {
            const profiles = [
                {
                    name: 'Default product',
                    sourceEntity: 'product',
                    config: []
                },
                {
                    name: 'Product with variants',
                    sourceEntity: 'product',
                    config: {
                        includeVariants: true
                    }
                },
                {
                    name: 'Default configurator settings',
                    sourceEntity: 'product_configurator_setting',
                    config: []
                },
                {
                    name: 'Default category',
                    sourceEntity: 'category',
                    config: []
                },
                {
                    name: 'Default media',
                    sourceEntity: 'media',
                    config: []
                }
            ];

            return Promise.resolve(profiles.filter((profile) => {
                let isAllowed = true;

                criteria.filters.forEach(filter => {
                    if (filter.type === 'equals' && profile[filter.field] !== filter.value) {
                        isAllowed = false;
                    }
                });

                return isAllowed;
            }));
        }
    };
};

describe('components/sw-import-export-exporter', () => {
    let wrapper;
    let localVue;

    beforeEach(() => {
        localVue = createLocalVue();

        wrapper = shallowMount(Shopware.Component.build('sw-import-export-exporter'), {
            localVue,
            stubs: {
                'sw-entity-single-select': Shopware.Component.build('sw-entity-single-select'),
                'sw-select-base': Shopware.Component.build('sw-select-base'),
                'sw-block-field': Shopware.Component.build('sw-block-field'),
                'sw-base-field': Shopware.Component.build('sw-base-field'),
                'sw-loader': true,
                'sw-icon': true,
                'sw-field-error': true,
                'sw-import-export-progress': true,
                'sw-select-result-list': Shopware.Component.build('sw-select-result-list'),
                'sw-select-result': Shopware.Component.build('sw-select-result'),
                'sw-highlight-text': Shopware.Component.build('sw-highlight-text'),
                'sw-popover': true,
                'sw-alert': true,
                'sw-modal': true,
                'sw-button': true
            },
            mocks: {
                $tc: snippetPath => snippetPath
            },
            provide: {
                importExport: {},
                repositoryFactory: {
                    create: () => repositoryMockFactory()
                }
            }
        });
    });

    afterEach(() => {
        localVue = null;
        wrapper.destroy();
    });

    it('should be a Vue.js component', () => {
        expect(wrapper.isVueInstance()).toBeTruthy();
    });

    it('should not show the warning when nothing is selected', () => {
        expect(wrapper.find('.sw-import-export-exporter__variants-warning').exists()).toBeFalsy();
    });

    it('should not show the warning when a product profile without variants is selected', async () => {
        wrapper.find('.sw-import-export-exporter__profile-select .sw-select__selection').trigger('click');
        await wrapper.vm.$nextTick();

        const defaultProduct = wrapper.find('.sw-select-option--0');
        expect(defaultProduct.text()).toBe('Default product');

        defaultProduct.trigger('click');

        expect(wrapper.find('.sw-entity-single-select__selection-text').text()).toBe('Default product');
        expect(wrapper.find('.sw-import-export-exporter__variants-warning').exists()).toBeFalsy();
    });

    it('should show the warning when a product profile with variants is selected', async () => {
        wrapper.find('.sw-import-export-exporter__profile-select .sw-select__selection').trigger('click');
        await wrapper.vm.$nextTick();

        const defaultProduct = wrapper.find('.sw-select-option--1');
        expect(defaultProduct.text()).toBe('Product with variants');

        defaultProduct.trigger('click');

        expect(wrapper.find('.sw-entity-single-select__selection-text').text()).toBe('Product with variants');

        const variantsWarning = wrapper.find('.sw-import-export-exporter__variants-warning');

        expect(variantsWarning.exists()).toBeTruthy();
        expect(variantsWarning.text()).toContain('sw-import-export.exporter.variantsWarning');
    });

    it('should show a warning which contains an open modal link', async () => {
        wrapper.find('.sw-import-export-exporter__profile-select .sw-select__selection').trigger('click');
        await wrapper.vm.$nextTick();

        wrapper.find('.sw-select-option--1').trigger('click');

        const variantsWarningLink = wrapper.find('.sw-import-export-exporter__variants-warning .sw-import-export-exporter__link');
        expect(variantsWarningLink.exists()).toBeTruthy();
        expect(variantsWarningLink.text()).toContain('sw-import-export.exporter.directExportLabel');
    });

    it('should show a modal with an exporter', async () => {
        wrapper.find('.sw-import-export-exporter__profile-select .sw-select__selection').trigger('click');
        await wrapper.vm.$nextTick();

        wrapper.find('.sw-select-option--1').trigger('click');

        const variantsWarningLink = wrapper.find('.sw-import-export-exporter__variants-warning .sw-import-export-exporter__link');
        variantsWarningLink.trigger('click');

        const modalExporter = wrapper.findAll({ name: 'sw-import-export-exporter' }).at(1);

        expect(modalExporter.exists()).toBeTruthy();
    });

    it('should show a modal which only contains configurator settings profiles', async () => {
        wrapper.find('.sw-import-export-exporter__profile-select .sw-select__selection').trigger('click');
        await wrapper.vm.$nextTick();

        wrapper.find('.sw-select-option--1').trigger('click');

        const variantsWarningLink = wrapper.find('.sw-import-export-exporter__variants-warning .sw-import-export-exporter__link');
        variantsWarningLink.trigger('click');

        const modalExporter = wrapper.findAll({ name: 'sw-import-export-exporter' }).at(1);

        expect(modalExporter.props().sourceEntity).toBe('product_configurator_setting');
    });

    it('should show all profiles when sourceEntity is empty', async () => {
        wrapper.setProps({ sourceEntity: '' });

        wrapper.find('.sw-import-export-exporter__profile-select .sw-select__selection').trigger('click');
        await wrapper.vm.$nextTick();

        const results = wrapper.findAll('.sw-select-result');
        const resultNames = results.wrappers.map(result => result.text());

        expect(resultNames).toContain('Default product');
        expect(resultNames).toContain('Product with variants');
        expect(resultNames).toContain('Default configurator settings');
        expect(resultNames).toContain('Default category');
        expect(resultNames).toContain('Default media');
    });

    it('should show only matching profiles when sourceEntity property is setted', async () => {
        wrapper.setProps({ sourceEntity: 'product_configurator_setting' });

        wrapper.find('.sw-import-export-exporter__profile-select .sw-select__selection').trigger('click');
        await wrapper.vm.$nextTick();

        const results = wrapper.findAll('.sw-select-result');
        const resultNames = results.wrappers.map(result => result.text());

        expect(resultNames).not.toContain('Default product');
        expect(resultNames).not.toContain('Product with variants');
        expect(resultNames).toContain('Default configurator settings');
        expect(resultNames).not.toContain('Default category');
        expect(resultNames).not.toContain('Default media');
    });
});