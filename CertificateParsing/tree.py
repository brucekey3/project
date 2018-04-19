from sklearn import tree
from sklearn.tree import _tree
import numpy as np
import csv
from sklearn.datasets import load_iris

def tree_to_code(tree, feature_names):
    tree_ = tree.tree_
    feature_name = [
        feature_names[i] if i != _tree.TREE_UNDEFINED else "undefined!"
        for i in tree_.feature
    ]
    print "def tree({}):".format(", ".join(feature_names))

    def recurse(node, depth):
        indent = "  " * depth
        if tree_.feature[node] != _tree.TREE_UNDEFINED:
            name = feature_name[node]
            threshold = tree_.threshold[node]
            print "{}if {} <= {}:".format(indent, name, threshold)
            recurse(tree_.children_left[node], depth + 1)
            print "{}else:  # if {} > {}".format(indent, name, threshold)
            recurse(tree_.children_right[node], depth + 1)
        else:
            print "{}return {}".format(indent, tree_.value[node])

    recurse(0, 1)

X = []
Y = np.array([1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])

labels = []

with open('results2.csv', 'rb') as csvfile:
     spamreader = csv.reader(csvfile, delimiter='/', quotechar='|')
     labels = spamreader.next()
     labels.pop(0)
     for row in spamreader:
         altered = row
         altered.pop(0)
         X.append(altered)

clf = tree.DecisionTreeClassifier()
clf = clf.fit(X, Y)

tree_to_code(clf, labels)
