import React from "react";
import { RootState } from "src/store/reducer";
import { cancelEdition } from "src/store/actions";
import { connect } from "react-redux";
import { RenamingPanelConnected } from "src/components/RenamingStatePanel/RenamingStatePanel";
import { CorrectionChoiceConnected } from "../CorrectionChoice/CorrectionChoice";
import './EditingPanel.css';
import { StateDisplayConnected } from "../StateDisplay/StateDisplay";

export enum EditionState {
    RenamingMapistoState = 1,
    AskingForEditionType,
    DisplayingState,
}

interface StateProps {
    editingState: EditionState;
}

interface DispatchProps {
    cancelEdition: () => void;
}
type Props = StateProps & DispatchProps;
class EditingPanel extends React.Component<Props, {}>{
    renderEditionComponent() {
        switch (this.props.editingState) {
            case EditionState.RenamingMapistoState:
                return <RenamingPanelConnected></RenamingPanelConnected>;
            case EditionState.AskingForEditionType:
                return <CorrectionChoiceConnected></CorrectionChoiceConnected>;
            case EditionState.DisplayingState:
                return <StateDisplayConnected></StateDisplayConnected>;
        }

    }
    render() {
        if (this.props.editingState) {
            return <div className="editing-panel">
                <div className="black-overlay" onClick={() => this.props.cancelEdition()}></div>
                <div className="popup-container">
                    {this.renderEditionComponent()}
                </div>
            </div>;
        } else {
            return null;
        }
    }
}

/**
 * Maps the redux state to the props of the loading Icon
 * @param state The redux state
 */
const mapStateToProps = (state: RootState): StateProps => ({
    editingState: state.editionType
});

export const EditingPanelConnected = connect(mapStateToProps, { cancelEdition })(EditingPanel);