import * as React from 'react'
import { RouteComponentProps } from 'react-router'
import { Form, Field } from 'react-final-form'
import { FieldArray } from 'react-final-form-arrays'
import arrayMutators from 'final-form-arrays'
import createDecorator from 'final-form-calculate'
import { IHowtoFormInput } from 'src/models/howto.models'
import TEMPLATE from './Template'
import { UploadedFile } from 'src/pages/common/UploadedFile/UploadedFile'
import { InputField, TextAreaField } from 'src/components/Form/Fields'
import { SelectField } from 'src/components/Form/Select.field'
import { Step } from './Step/Step'
import { Button } from 'src/components/Button'
import { HowtoStore } from 'src/stores/Howto/howto.store'
import Heading from 'src/components/Heading'
import Flex from 'src/components/Flex'
import { Box } from 'rebass'
import { TagsSelectField } from 'src/components/Form/TagsSelect.field'
import { ImageInputField } from 'src/components/Form/ImageInput.field'
import { FileInputField } from 'src/components/Form/FileInput.field'
import posed, { PoseGroup } from 'react-pose'
import { inject } from 'mobx-react'
import { Modal } from 'src/components/Modal/Modal'
import { HowToSubmitStatus } from './SubmitStatus'
import { stripSpecialCharacters } from 'src/utils/helpers'
import { PostingGuidelines } from './PostingGuidelines'

interface IState {
  formValues: IHowtoFormInput
  formSaved: boolean
  _docID: string
  _toDocsList: boolean
  showSubmitModal?: boolean
}
interface IProps extends RouteComponentProps<any> {}
interface IInjectedProps extends IProps {
  howtoStore: HowtoStore
}

const AnimationContainer = posed.div({
  // use flip pose to prevent default spring action on list item removed
  flip: {
    transition: {
      // type: 'tween',
      // ease: 'linear',
    },
  },
  // use a pre-enter pose as otherwise default will be the exit state and so will animate
  // horizontally as well
  preEnter: {
    opacity: 0,
  },
  enter: {
    opacity: 1,
    duration: 200,
    applyAtStart: { display: 'block' },
  },
  exit: {
    applyAtStart: { display: 'none' },
    duration: 200,
  },
  // note, on react final forms all array animations are really buggy, see
  // https://github.com/final-form/react-final-form-arrays/issues/22
  // not including exit animation as really bad performance
})

// validation - return undefined if no error (i.e. valid)
const required = (value: any) => (value ? undefined : 'Required')

@inject('howtoStore')
export class CreateHowto extends React.Component<IProps, IState> {
  uploadRefs: { [key: string]: UploadedFile | null } = {}
  constructor(props: any) {
    super(props)
    // generate unique id for db and storage references and assign to state
    const docID = this.store.generateID()
    this.state = {
      formValues: { ...TEMPLATE.INITIAL_VALUES, id: docID } as IHowtoFormInput,
      formSaved: false,
      _docID: docID,
      _toDocsList: false,
    }
  }

  get injected() {
    return this.props as IInjectedProps
  }
  get store() {
    return this.injected.howtoStore
  }

  public onSubmit = async (formValues: IHowtoFormInput) => {
    this.setState({ showSubmitModal: true })
    await this.store.uploadHowTo(formValues, this.state._docID)
  }

  public validateTitle = async (value: any) => {
    return this.store.validateTitle(value, 'v2_howtos')
  }

  // automatically generate the slug when the title changes
  private calculatedFields = createDecorator({
    field: 'title',
    updates: {
      slug: title => stripSpecialCharacters(title).toLowerCase(),
    },
  })
  public render() {
    const { formValues } = this.state
    return (
      <Form
        onSubmit={v => this.onSubmit(v as IHowtoFormInput)}
        initialValues={formValues}
        mutators={{
          ...arrayMutators,
        }}
        validateOnBlur
        decorators={[this.calculatedFields]}
        render={({ submitting, values, invalid, errors, handleSubmit }) => {
          const disabled = invalid || submitting
          return (
            <Flex m={'0'} p={'0'} bg={'inherit'} flexWrap="wrap">
              <Flex bg="inherit" p={'0'} width={[1, 1, 2 / 3]}>
                {/* using prevent default as sometimes submit triggered unintentionally */}
                <form onSubmit={e => e.preventDefault()}>
                  {/* How To Info */}
                  <Flex flexDirection={'column'} p={3}>
                    <Flex card mediumRadius px={3} py={2}>
                      <Heading heroTitle>Create your How-To</Heading>
                    </Flex>
                    <Flex p={0} flexWrap="wrap">
                      {/* Left Side */}
                      <Flex p={0} pr={2} flex={1} flexDirection="column">
                        <Field
                          name="title"
                          validateFields={[]}
                          validate={value => this.validateTitle(value)}
                          component={InputField}
                          placeholder="Title of your How-to *"
                        />
                        <Field
                          name="tags"
                          component={TagsSelectField}
                          category="how-to"
                        />
                        <Flex p={0}>
                          <Field
                            name="time"
                            validate={required}
                            validateFields={[]}
                            options={TEMPLATE.TIME_OPTIONS}
                            component={SelectField}
                            placeholder="How much time? *"
                            style={{ marginRight: '4px' }}
                          />
                          <Field
                            name="difficulty_level"
                            validate={required}
                            validateFields={[]}
                            component={SelectField}
                            options={TEMPLATE.DIFFICULTY_OPTIONS}
                            placeholder="How hard is it? *"
                            style={{ marginLeft: '4px' }}
                          />
                        </Flex>
                        <Field
                          name="description"
                          validate={required}
                          validateFields={[]}
                          component={TextAreaField}
                          style={{
                            resize: 'none',
                            flex: 1,
                            minHeight: '150px',
                          }}
                          placeholder="Introduction to your How-To, keep it to 100 words please! *"
                        />
                      </Flex>
                      {/* Right side */}
                      <Box p={0} width={[1, null, '380px']}>
                        <Field
                          name="cover_image"
                          validate={required}
                          validateFields={[]}
                          component={ImageInputField}
                        />
                        <Field
                          name="caption"
                          component={InputField}
                          placeholder="Insert Caption"
                        />
                        <Field name="files" component={FileInputField} />
                      </Box>
                    </Flex>
                  </Flex>

                  {/* Steps Info */}
                  <FieldArray name="steps">
                    {({ fields }) => (
                      <>
                        <PoseGroup preEnterPose="preEnter">
                          {fields.map((name, index: number) => (
                            <AnimationContainer
                              key={fields.value[index]._animationKey}
                            >
                              <Step
                                key={fields.value[index]._animationKey}
                                step={name}
                                index={index}
                                onDelete={(fieldIndex: number) => {
                                  fields.remove(fieldIndex)
                                }}
                              />
                            </AnimationContainer>
                          ))}
                        </PoseGroup>

                        <Button
                          icon={'add'}
                          width={300}
                          mx="auto"
                          my={20}
                          variant="dark"
                          bg="yellow"
                          onClick={() => {
                            fields.push({
                              title: '',
                              text: '',
                              images: [],
                              // HACK - need unique key, this is a rough method to generate form random numbers
                              _animationKey: `unique${Math.random()
                                .toString(36)
                                .substring(7)}`,
                            })
                          }}
                        >
                          add step
                        </Button>
                      </>
                    )}
                  </FieldArray>
                </form>
                {this.state.showSubmitModal && (
                  <Modal>
                    <>
                      <HowToSubmitStatus />
                      <Button
                        mt={3}
                        variant={submitting ? 'disabled' : 'outline'}
                        icon="arrow-forward"
                        onClick={() =>
                          this.props.history.push('/how-to/' + values.slug)
                        }
                      >
                        View How-To
                      </Button>
                    </>
                  </Modal>
                )}
              </Flex>
              {/* post guidelines container */}
              <Box
                width={[1, 1, 1 / 3]}
                height={'100%'}
                bg="inherit"
                p={0}
                pl={2}
              >
                <PostingGuidelines />
                <Button
                  onClick={() => handleSubmit()}
                  width={1}
                  mt={3}
                  variant={disabled ? 'disabled' : 'secondary'}
                  disabled={submitting || invalid}
                >
                  Publish
                </Button>
              </Box>
            </Flex>
          )
        }}
      />
    )
  }
}
