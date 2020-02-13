import React, {useEffect} from 'react';
import {
  View,
  NativeModules,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import useForm from 'react-hook-form';
import * as yup from 'yup';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
// COMPONENTS
import InputText from './InputText';
import DatePicker from './DatePicker';
import SelectPicker from './SelectPicker';
import CheckboxField from './CheckboxField';
import FormGroupLabel from './FormGroupLabel';
import RadioButtons from './RadioButtons';
import TextOnly from './TextOnly';

export default ({
  formConfig,
  mode = 'onSubmit',
  onSubmit,
  onChangeCustom = (field, value) => value,
  customStyles,
  currentLocale,
  customIcon,
  topComponent,
  bottomComponent,
  defaultValues = {},
  defaultSelectValues = {},
  defaultTextModals = {},
  keyboardAwareScrollViewProps = {},
}) => {
  let deviceLanguage = null;
  let lang = null;
  if (Platform.OS === 'ios') {
    lang = NativeModules.SettingsManager.settings.AppleLanguages[0];
    deviceLanguage = lang.split('-')[0];
  } else {
    lang = NativeModules.I18nManager.localeIdentifier;
    deviceLanguage = lang.split('_')[0];
  }
  const validations = () => {
    const validator = {};
    formConfig.groups.forEach(g => {
      g.children.forEach(f => {
        if (f.validations) {
          validator[f.name] = yup;
          f.validations.forEach(v => {
            let params = [];
            if (v.params) {
              Object.keys(v.params).forEach(k => {
                let val = v.params[k];
                if (k === 'message' && val && val instanceof Object) {
                  val =
                    val[currentLocale] || val[deviceLanguage] || val.default;
                }
                params.push(val);
              });
            }
            validator[f.name] = validator[f.name][v.name].apply(
              validator[f.name],
              params,
            );
          });
          if (
            ['password-confirmation', 'passwordConfirmation'].includes(f.name)
          ) {
            validator[f.name] = validator[f.name].oneOf(
              [yup.ref('password'), null],
              f.passwordConfirmationMessage[currentLocale] ||
                f.passwordConfirmationMessage[deviceLanguage] ||
                f.passwordConfirmationMessage.default,
            );
          }
        }
      });
    });
    return validator;
  };

  const validationSchema = yup.object().shape(validations());

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    errors,
    triggerValidation,
  } = useForm({mode, validationSchema});

  // NOTE: Old methods to watch only the fileds with the showIf property
  // let fields = [];
  // formConfig.groups.forEach(g => {
  //   fields.push(
  //     g.children.filter(c => c.showIf).map(c => c.showIf.split('=')[0]),
  //   );
  // });
  // const watchFields = watch(fields.reduce((acc, val) => acc.concat(val), []));
  const watchFields = watch();

  // NOTE: Use for add default values
  useEffect(() => {
    Object.keys(defaultValues).forEach(key => {
      setValue(key, defaultValues[key]);
    });
  }, [register]);

  const formComponents = () =>
    formConfig.groups.map((g, index) => (
      <View key={index}>
        {g.label && (
          <FormGroupLabel
            label={
              g.label[currentLocale] ||
              g.label[deviceLanguage] ||
              g.label.default
            }
          />
        )}
        {g.children.map(f => {
          const styleName = f.name
            .split(/_|-/i)
            .map(l => `${l[0].toUpperCase()}${l.slice(1)}`)
            .join('');
          const label = f.label
            ? f.label[currentLocale] ||
              f.label[deviceLanguage] ||
              f.label.default
            : null;
          const placeholder = f.placeholder
            ? f.placeholder[currentLocale] ||
              f.placeholder[deviceLanguage] ||
              f.placeholder.default
            : null;
          const description = f.description
            ? f.description[currentLocale] ||
              f.description[deviceLanguage] ||
              f.description.default
            : null;
          let conditionName = null;
          if (f.showIf) {
            conditionName = f.showIf.split('=')[0];
          }
          if (
            conditionName &&
            f.showIf !== `${conditionName}=${watchFields[conditionName]}`
          ) {
            return null;
          }
          if (['text', 'password', 'email'].includes(f.type)) {
            return (
              <InputText
                key={f.name}
                field={f}
                styleName={styleName}
                label={label}
                placeholder={placeholder}
                customIcon={customIcon}
                reference={() => register({name: f.name})}
                defaultValue={defaultValues[f.name]}
                changeBackgroundOnFocus={f.changeBackgroundOnFocus}
                onChange={text => {
                  const customText = onChangeCustom(f.name, text);
                  setValue(f.name, customText, f.require);
                }}
                onBlur={async () => {
                  if (mode === 'onBlur') {
                    await triggerValidation();
                  }
                }}
                errors={errors}
                customStyles={customStyles}
              />
            );
          }
          if (f.type === 'date') {
            return (
              <DatePicker
                key={f.name}
                field={f}
                styleName={styleName}
                label={label}
                defaultValue={defaultValues[f.name]}
                currentLocale={currentLocale || deviceLanguage}
                reference={() => register({name: f.name})}
                onChange={date => {
                  const customDate = onChangeCustom(f.name, date);
                  setValue(f.name, customDate, f.require);
                }}
                errors={errors}
                customStyles={customStyles}
                placeholder={placeholder}
              />
            );
          }
          if (f.type === 'select') {
            const confirmLabel = f.confirmLabel
              ? f.confirmLabel[currentLocale] ||
                f.confirmLabel[deviceLanguage] ||
                f.confirmLabel.default
              : 'Done';
            return (
              <SelectPicker
                key={f.name}
                field={f}
                styleName={styleName}
                label={label}
                defaultValue={defaultValues[f.name]}
                customIcon={customIcon}
                reference={() => register({name: f.name})}
                items={f.items || defaultSelectValues[f.name] || []}
                onChange={date => {
                  const customDate = onChangeCustom(f.name, date);
                  setValue(f.name, customDate, f.require);
                }}
                errors={errors}
                customStyles={customStyles}
                currentLocale={currentLocale || deviceLanguage}
                confirmLabel={confirmLabel}
                placeholder={placeholder}
              />
            );
          }
          if (f.type === 'checkbox') {
            return (
              <CheckboxField
                key={f.name}
                field={f}
                styleName={styleName}
                label={label}
                defaultValue={defaultValues[f.name]}
                defaultTextModal={defaultTextModals[f.name]}
                reference={() => register({name: f.name})}
                onChange={text => {
                  const customValue = onChangeCustom(f.name, text);
                  setValue(f.name, customValue, f.require);
                }}
                errors={errors}
                customStyles={customStyles}
              />
            );
          }
          if (f.type === 'radio') {
            return (
              <RadioButtons
                key={f.name}
                field={f}
                styleName={styleName}
                label={label}
                defaultValue={defaultValues[f.name]}
                placeholder={placeholder}
                reference={() => register({name: f.name})}
                onChange={text => {
                  const customText = onChangeCustom(f.name, text);
                  setValue(f.name, customText, f.require);
                }}
                onBlur={async () => {
                  if (mode === 'onBlur') {
                    await triggerValidation();
                  }
                }}
                errors={errors}
                customStyles={customStyles}
                items={f.items}
                description={description}
                currentLocale={currentLocale || deviceLanguage}
              />
            );
          }
          if (f.type === 'text-only') {
            return (
              <TextOnly
                key={f.name}
                field={f}
                styleName={styleName}
                label={label}
                customStyles={customStyles}
                description={description}
              />
            );
          }
          return null;
        })}
      </View>
    ));
  const showSubmit =
    formConfig.showSubmit === undefined ? true : formConfig.showSubmit;
  return (
    <KeyboardAwareScrollView {...keyboardAwareScrollViewProps}>
      <View
        style={StyleSheet.flatten([
          styles.formContainer,
          customStyles.formContainer,
        ])}>
        <View style={{alignItems: 'center'}}>
          {topComponent}
        </View>
        {formComponents()}
        {showSubmit && (
          <TouchableOpacity
            style={StyleSheet.flatten([
              styles.submitButtonContainer,
              customStyles.submitButtonContainer,
            ])}
            onPress={handleSubmit(onSubmit)}>
            <Text
              style={StyleSheet.flatten([
                styles.submitButtonText,
                customStyles.submitButtonText,
              ])}>
              {formConfig.submitText[currentLocale] ||
                formConfig.submitText[deviceLanguage] ||
                formConfig.submitText.default}
            </Text>
          </TouchableOpacity>
        )}
        <View style={{alignItems: 'center'}}>
          {bottomComponent}
       </View>
      </View>
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
    paddingBottom: 0,
    paddingLeft: 15,
    paddingRight: 15,
  },
  submitButtonContainer: {
    backgroundColor: '#34baeb',
    borderRadius: 5,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
});
